import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { updateDispensedMedicines } from "../repositories/dispense.dispensing.repository";
import {
	findDispensingByPrescriptionId,
	findPrescriptionById,
} from "../repositories/shared.dispensing.repository";
import type {
	DispenseDispensingBody,
	DispenseDispensingOutput,
} from "../validations/dispense.dispensing.validation";

const logger = createServiceLogger("dispenseDispensing");

/**
 * Dispense medicines for a prescription
 */
export async function dispenseMedicinesService({
	tenantId,
	prescriptionId,
	pharmacistId,
	medicines,
}: {
	tenantId: string;
	prescriptionId: string;
	pharmacistId: string;
} & DispenseDispensingBody): Promise<DispenseDispensingOutput> {
	logger.info(
		{ tenantId, prescriptionId, medicineCount: medicines.length },
		"Dispensing medicines",
	);

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

	// Get prescription to validate quantities
	const prescription = await findPrescriptionById({ tenantId, prescriptionId });
	if (!prescription) {
		throw new NotFoundError("Prescription not found", "PRESCRIPTION_NOT_FOUND");
	}

	// Create prescription medicine map
	const prescriptionMedicineMap = new Map(
		prescription.medicines.map((m) => [String(m._id), m]),
	);

	// Validate each medicine
	for (const med of medicines) {
		const prescriptionMed = prescriptionMedicineMap.get(med.medicineId);
		if (!prescriptionMed) {
			throw new BadRequestError(
				`Medicine ${med.medicineId} not found in prescription`,
				"MEDICINE_NOT_IN_PRESCRIPTION",
			);
		}

		if (med.dispensedQuantity > (prescriptionMed.quantity || 0)) {
			throw new BadRequestError(
				`Quantity exceeds prescribed amount for medicine ${med.medicineId}`,
				"QUANTITY_EXCEEDS_PRESCRIBED",
			);
		}
	}

	// Update dispensing record
	const updatedDispensing = await updateDispensedMedicines({
		tenantId,
		prescriptionId,
		medicines,
	});

	if (!updatedDispensing) {
		throw new NotFoundError(
			"Failed to update dispensing",
			"DISPENSING_NOT_FOUND",
		);
	}

	// Count dispensed and pending
	let totalDispensed = 0;
	let totalPending = 0;
	for (const med of updatedDispensing.medicines) {
		if (med.status === "DISPENSED") {
			totalDispensed++;
		} else if (med.status === "PENDING") {
			totalPending++;
		}
	}

	// Map medicines with prescription info
	const medicinesOutput = updatedDispensing.medicines.map((med) => {
		const prescriptionMed = prescriptionMedicineMap.get(med.medicineId);
		return {
			id: med.medicineId,
			name: prescriptionMed?.name || "",
			prescribedQuantity: prescriptionMed?.quantity || 0,
			dispensedQuantity: med.dispensedQuantity,
			status: med.status,
		};
	});

	logger.info(
		{ tenantId, prescriptionId, totalDispensed, totalPending },
		"Medicines dispensed successfully",
	);

	return {
		id: String(updatedDispensing._id),
		prescriptionId: String(updatedDispensing.prescriptionId),
		medicines: medicinesOutput,
		totalDispensed,
		totalPending,
	};
}
