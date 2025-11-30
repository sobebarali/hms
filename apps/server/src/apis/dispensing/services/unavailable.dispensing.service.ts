import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findDispensingByPrescriptionId } from "../repositories/shared.dispensing.repository";
import { markMedicineUnavailable } from "../repositories/unavailable.dispensing.repository";
import type {
	UnavailableDispensingBody,
	UnavailableDispensingOutput,
} from "../validations/unavailable.dispensing.validation";

const logger = createServiceLogger("unavailableDispensing");

/**
 * Mark a medicine as unavailable
 */
export async function markMedicineUnavailableService({
	tenantId,
	prescriptionId,
	medicineId,
	reason,
	alternativeSuggested,
}: {
	tenantId: string;
	prescriptionId: string;
} & UnavailableDispensingBody): Promise<UnavailableDispensingOutput> {
	logger.info(
		{ tenantId, prescriptionId, medicineId },
		"Marking medicine as unavailable",
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

	// Check if medicine exists and is not already dispensed
	const medicine = dispensing.medicines.find(
		(m) => m.medicineId === medicineId,
	);
	if (!medicine) {
		throw new NotFoundError(
			"Medicine not found in dispensing",
			"MEDICINE_NOT_FOUND",
		);
	}

	if (medicine.status === "DISPENSED") {
		throw new BadRequestError(
			"Medicine has already been dispensed",
			"ALREADY_DISPENSED",
		);
	}

	// Mark as unavailable
	const result = await markMedicineUnavailable({
		tenantId,
		prescriptionId,
		medicineId,
		reason,
		alternativeSuggested,
	});

	if (!result) {
		throw new NotFoundError("Failed to update medicine", "MEDICINE_NOT_FOUND");
	}

	logger.info(
		{ tenantId, prescriptionId, medicineId },
		"Medicine marked as unavailable",
	);

	return {
		medicineId,
		status: "UNAVAILABLE",
		reason,
		alternativeSuggested,
	};
}
