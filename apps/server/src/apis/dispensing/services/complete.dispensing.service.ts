import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import { completeDispensing } from "../repositories/complete.dispensing.repository";
import {
	findDispensingByPrescriptionId,
	findPrescriptionById,
	updatePrescriptionStatus,
} from "../repositories/shared.dispensing.repository";
import type {
	CompleteDispensingBody,
	CompleteDispensingOutput,
} from "../validations/complete.dispensing.validation";

const logger = createServiceLogger("completeDispensing");

/**
 * Complete dispensing for a prescription
 */
export async function completeDispensingService({
	tenantId,
	prescriptionId,
	pharmacistId,
	notes,
	patientCounseled,
}: {
	tenantId: string;
	prescriptionId: string;
	pharmacistId: string;
} & CompleteDispensingBody): Promise<CompleteDispensingOutput> {
	logger.info({ tenantId, prescriptionId }, "Completing dispensing");

	// Get dispensing record
	const dispensing = await findDispensingByPrescriptionId({
		tenantId,
		prescriptionId,
	});
	if (!dispensing) {
		throw new NotFoundError(
			"Dispensing record not found",
			"DISPENSING_NOT_FOUND",
		);
	}

	// Check if assigned to this pharmacist
	if (dispensing.assignedTo !== pharmacistId) {
		throw new ForbiddenError(
			"Prescription assigned to different pharmacist",
			"NOT_ASSIGNED",
		);
	}

	// Check if all medicines are dispensed or unavailable
	const pendingMedicines = dispensing.medicines.filter(
		(m) => m.status === "PENDING",
	);
	if (pendingMedicines.length > 0) {
		throw new BadRequestError(
			"Not all medicines have been dispensed",
			"INCOMPLETE_DISPENSING",
		);
	}

	// Get prescription for medicine names
	const prescription = await findPrescriptionById({ tenantId, prescriptionId });
	if (!prescription) {
		throw new NotFoundError("Prescription not found", "PRESCRIPTION_NOT_FOUND");
	}

	// Create prescription medicine map
	const prescriptionMedicineMap = new Map(
		prescription.medicines.map((m) => [String(m._id), m]),
	);

	// Complete dispensing
	const completedDispensing = await completeDispensing({
		tenantId,
		prescriptionId,
		notes,
		patientCounseled,
	});

	if (!completedDispensing) {
		throw new NotFoundError(
			"Failed to complete dispensing",
			"DISPENSING_NOT_FOUND",
		);
	}

	// Update prescription status
	await updatePrescriptionStatus({
		tenantId,
		prescriptionId,
		status: "DISPENSED",
	});

	// Get pharmacist info
	const pharmacist = await findStaffById({ tenantId, staffId: pharmacistId });

	// Map medicines
	const medicines = completedDispensing.medicines.map((med) => {
		const prescriptionMed = prescriptionMedicineMap.get(med.medicineId);
		return {
			id: med.medicineId,
			name: prescriptionMed?.name || "",
			prescribedQuantity: prescriptionMed?.quantity || 0,
			dispensedQuantity: med.dispensedQuantity,
			batchNumber: med.batchNumber,
			expiryDate: med.expiryDate?.toISOString(),
			status: med.status,
			substituted: med.substituted,
			substituteNote: med.substituteNote,
		};
	});

	logger.info(
		{ tenantId, prescriptionId },
		"Dispensing completed successfully",
	);

	return {
		id: String(completedDispensing._id),
		prescriptionId: String(completedDispensing.prescriptionId),
		status: completedDispensing.status,
		completedAt:
			completedDispensing.completedAt?.toISOString() ||
			new Date().toISOString(),
		completedBy: {
			id: pharmacist ? String(pharmacist._id) : pharmacistId,
			firstName: pharmacist?.firstName || "",
			lastName: pharmacist?.lastName || "",
		},
		medicines,
	};
}
