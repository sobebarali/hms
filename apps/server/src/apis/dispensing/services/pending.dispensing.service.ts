import { createServiceLogger } from "../../../lib/logger";
import { findPatientsByIds } from "../../patients/repositories/shared.patients.repository";
import { findStaffByIds } from "../../users/repositories/shared.users.repository";
import {
	countUrgentPrescriptions,
	listPendingPrescriptions,
} from "../repositories/pending.dispensing.repository";
import type {
	PendingDispensingInput,
	PendingDispensingOutput,
	PendingPrescription,
} from "../validations/pending.dispensing.validation";

const logger = createServiceLogger("pendingDispensing");

/**
 * List pending prescriptions awaiting dispensing
 */
export async function listPendingPrescriptionsService({
	tenantId,
	page: pageParam,
	limit: limitParam,
	priority,
	departmentId,
	sortBy: sortByParam,
	sortOrder: sortOrderParam,
}: {
	tenantId: string;
} & PendingDispensingInput): Promise<PendingDispensingOutput> {
	logger.info(
		{ tenantId, page: pageParam, limit: limitParam },
		"Listing pending prescriptions",
	);

	const page = Number(pageParam) || 1;
	const limit = Number(limitParam) || 20;
	const sortBy = sortByParam || "createdAt";
	const sortOrder = sortOrderParam || "asc";

	const result = await listPendingPrescriptions({
		tenantId,
		page,
		limit,
		departmentId,
		sortBy,
		sortOrder,
	});

	// Get unique patient and doctor IDs for batch lookup
	const patientIds = [
		...new Set(result.prescriptions.map((p) => p.patientId).filter(Boolean)),
	] as string[];

	const doctorIds = [
		...new Set(result.prescriptions.map((p) => p.doctorId).filter(Boolean)),
	] as string[];

	// Batch fetch patients and doctors
	const [patients, doctors] = await Promise.all([
		patientIds.length > 0
			? findPatientsByIds({ tenantId, patientIds })
			: Promise.resolve([]),
		doctorIds.length > 0
			? findStaffByIds({ tenantId, staffIds: doctorIds })
			: Promise.resolve([]),
	]);

	// Create lookup maps
	const patientMap = new Map(patients.map((p) => [String(p._id), p]));
	const doctorMap = new Map(doctors.map((d) => [String(d._id), d]));

	// Calculate summary
	const [urgentCount] = await Promise.all([
		countUrgentPrescriptions({ tenantId }),
	]);

	// Calculate average waiting time
	const now = Date.now();
	const totalWaitTime = result.prescriptions.reduce((acc, p) => {
		const createdAt = p.createdAt?.getTime() || now;
		return acc + (now - createdAt);
	}, 0);
	const averageWaitTime =
		result.prescriptions.length > 0
			? Math.round(totalWaitTime / result.prescriptions.length / 60000)
			: 0;

	// Helper function to calculate priority based on waiting time
	const calculatePriority = (waitingTimeMinutes: number): string => {
		if (waitingTimeMinutes >= 60) return "URGENT";
		if (waitingTimeMinutes >= 30) return "HIGH";
		if (waitingTimeMinutes >= 15) return "NORMAL";
		return "LOW";
	};

	// Map to output DTO and filter by priority if specified
	const allData: PendingPrescription[] = result.prescriptions.map(
		(prescription) => {
			const patient = patientMap.get(String(prescription.patientId));
			const doctor = doctorMap.get(String(prescription.doctorId));
			const createdAt = prescription.createdAt?.getTime() || now;
			const waitingTime = Math.round((now - createdAt) / 60000);
			const calculatedPriority = calculatePriority(waitingTime);

			// Map medicines to output format
			const medicines = (prescription.medicines || []).map((med) => ({
				id: String(med._id),
				name: med.name,
				dosage: med.dosage,
				quantity: med.quantity || 0,
			}));

			return {
				id: String(prescription._id),
				prescriptionId: prescription.prescriptionId,
				patient: {
					id: String(prescription.patientId),
					patientId: patient?.patientId || "",
					firstName: patient?.firstName || "",
					lastName: patient?.lastName || "",
				},
				doctor: {
					id: String(prescription.doctorId),
					firstName: doctor?.firstName || "",
					lastName: doctor?.lastName || "",
				},
				medicines,
				medicineCount: prescription.medicines?.length || 0,
				priority: calculatedPriority,
				createdAt:
					prescription.createdAt?.toISOString() || new Date().toISOString(),
				waitingTime,
			};
		},
	);

	// Filter by priority if specified
	const data = priority
		? allData.filter((p) => p.priority === priority)
		: allData;

	logger.info(
		{
			tenantId,
			page,
			limit,
			total: result.total,
		},
		"Pending prescriptions listed successfully",
	);

	return {
		data,
		pagination: {
			page: result.page,
			limit: result.limit,
			total: result.total,
			totalPages: result.totalPages,
		},
		summary: {
			totalPending: result.total,
			urgent: urgentCount,
			averageWaitTime,
		},
	};
}
