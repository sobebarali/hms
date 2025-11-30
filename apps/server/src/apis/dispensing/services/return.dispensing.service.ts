import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { deleteDispensing } from "../repositories/return.dispensing.repository";
import {
	findDispensingByPrescriptionId,
	updatePrescriptionStatus,
} from "../repositories/shared.dispensing.repository";
import type { ReturnDispensingOutput } from "../validations/return.dispensing.validation";

const logger = createServiceLogger("returnDispensing");

/**
 * Return prescription to pending queue
 */
export async function returnToQueueService({
	tenantId,
	prescriptionId,
	reason,
}: {
	tenantId: string;
	prescriptionId: string;
	reason: string;
}): Promise<ReturnDispensingOutput> {
	logger.info({ tenantId, prescriptionId, reason }, "Returning to queue");

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

	// Check if any medicine has been dispensed
	const dispensedMedicines = dispensing.medicines.filter(
		(m) => m.status === "DISPENSED",
	);
	if (dispensedMedicines.length > 0) {
		throw new BadRequestError(
			"Cannot return after partial dispensing",
			"PARTIALLY_DISPENSED",
		);
	}

	// Delete dispensing record
	const deleted = await deleteDispensing({ tenantId, prescriptionId });
	if (!deleted) {
		throw new NotFoundError(
			"Failed to delete dispensing",
			"DISPENSING_NOT_FOUND",
		);
	}

	// Update prescription status back to pending
	await updatePrescriptionStatus({
		tenantId,
		prescriptionId,
		status: "PENDING",
	});

	logger.info(
		{ tenantId, prescriptionId, reason },
		"Prescription returned to queue",
	);

	return {
		prescriptionId,
		status: "PENDING",
		returnedAt: new Date().toISOString(),
	};
}
