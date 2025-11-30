import { BadRequestError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientsByIds } from "../../patients/repositories/shared.patients.repository";
import { findStaffByIds } from "../../users/repositories/shared.users.repository";
import { listDispensingHistory } from "../repositories/history.dispensing.repository";
import { findPrescriptionsByIds } from "../repositories/shared.dispensing.repository";
import type {
	HistoryDispensingInput,
	HistoryDispensingOutput,
	HistoryDispensingRecord,
} from "../validations/history.dispensing.validation";

const logger = createServiceLogger("historyDispensing");

/**
 * List dispensing history with filters
 */
export async function listDispensingHistoryService({
	tenantId,
	page: pageParam,
	limit: limitParam,
	pharmacistId,
	patientId,
	startDate,
	endDate,
	status,
}: {
	tenantId: string;
} & HistoryDispensingInput): Promise<HistoryDispensingOutput> {
	logger.info(
		{ tenantId, page: pageParam, limit: limitParam },
		"Listing dispensing history",
	);

	const page = Number(pageParam) || 1;
	const limit = Number(limitParam) || 20;

	// Validate date range if provided
	if (startDate && endDate) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		if (start > end) {
			throw new BadRequestError(
				"Start date must be before end date",
				"INVALID_DATE_RANGE",
			);
		}
	}

	const result = await listDispensingHistory({
		tenantId,
		page,
		limit,
		pharmacistId,
		patientId,
		startDate,
		endDate,
		status,
	});

	// Get unique pharmacist IDs for batch lookup
	const pharmacistIds = [
		...new Set(result.records.map((r) => r.assignedTo).filter(Boolean)),
	] as string[];

	// Get unique prescription IDs to fetch patient info
	const prescriptionIds = [
		...new Set(result.records.map((r) => r.prescriptionId)),
	];

	// Batch fetch pharmacists
	const pharmacists =
		pharmacistIds.length > 0
			? await findStaffByIds({ tenantId, staffIds: pharmacistIds })
			: [];

	// Create pharmacist lookup map
	const pharmacistMap = new Map(pharmacists.map((p) => [String(p._id), p]));

	// Fetch prescriptions to get patient IDs (batch lookup instead of N+1)
	const prescriptions =
		prescriptionIds.length > 0
			? await findPrescriptionsByIds({
					tenantId,
					prescriptionIds: prescriptionIds as string[],
				})
			: [];

	// Create prescription map
	const prescriptionMap = new Map(prescriptions.map((p) => [String(p._id), p]));

	// Get unique patient IDs
	const patientIds = [
		...new Set(prescriptions.map((p) => p.patientId).filter(Boolean)),
	] as string[];

	// Batch fetch patients
	const patients =
		patientIds.length > 0
			? await findPatientsByIds({ tenantId, patientIds })
			: [];

	// Create patient lookup map
	const patientMap = new Map(patients.map((p) => [String(p._id), p]));

	// Map to output DTO
	const data: HistoryDispensingRecord[] = result.records.map((record) => {
		const pharmacist = pharmacistMap.get(record.assignedTo || "");
		const prescription = prescriptionMap.get(record.prescriptionId);
		const patient = patientMap.get(prescription?.patientId || "");

		return {
			id: String(record._id),
			prescriptionId: record.prescriptionId,
			patient: {
				id: patient ? String(patient._id) : prescription?.patientId || "",
				patientId: patient?.patientId || "",
				firstName: patient?.firstName || "",
				lastName: patient?.lastName || "",
			},
			pharmacist: pharmacist
				? {
						id: String(pharmacist._id),
						firstName: pharmacist.firstName,
						lastName: pharmacist.lastName,
					}
				: undefined,
			medicineCount: record.medicines?.length || 0,
			status: record.status,
			startedAt: record.startedAt?.toISOString(),
			completedAt: record.completedAt?.toISOString(),
			createdAt: record.createdAt?.toISOString() || new Date().toISOString(),
		};
	});

	logger.info(
		{
			tenantId,
			page,
			limit,
			total: result.total,
		},
		"Dispensing history listed successfully",
	);

	return {
		data,
		pagination: {
			page: result.page,
			limit: result.limit,
			total: result.total,
			totalPages: result.totalPages,
		},
	};
}
