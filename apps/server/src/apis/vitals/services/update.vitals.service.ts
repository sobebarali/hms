import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findVitalsById } from "../repositories/shared.vitals.repository";
import { updateVitalsNotes } from "../repositories/update.vitals.repository";
import type {
	UpdateVitalsInput,
	UpdateVitalsOutput,
} from "../validations/update.vitals.validation";

const logger = createServiceLogger("updateVitals");

// 24 hours in milliseconds
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Update vitals record (notes only, with correction reason)
 */
export async function updateVitalsService({
	tenantId,
	vitalsId,
	notes,
	correctionReason,
}: {
	tenantId: string;
	vitalsId: string;
} & UpdateVitalsInput): Promise<UpdateVitalsOutput> {
	logger.info({ tenantId, vitalsId }, "Updating vitals");

	// Find existing vitals record
	const existingVitals = await findVitalsById({ tenantId, vitalsId });
	if (!existingVitals) {
		logger.warn({ tenantId, vitalsId }, "Vitals not found");
		throw new NotFoundError("Vitals record not found", "NOT_FOUND");
	}

	// Check if record is older than 24 hours
	const recordAge = Date.now() - existingVitals.recordedAt.getTime();
	if (recordAge > TWENTY_FOUR_HOURS_MS) {
		logger.warn(
			{ tenantId, vitalsId, recordAge },
			"Vitals record is too old to modify",
		);
		throw new BadRequestError(
			"Cannot modify records older than 24 hours",
			"RECORD_TOO_OLD",
		);
	}

	// Update vitals notes with correction reason
	const updatedVitals = await updateVitalsNotes({
		tenantId,
		vitalsId,
		notes,
		correctionReason,
	});

	if (!updatedVitals) {
		throw new NotFoundError("Failed to update vitals record", "UPDATE_FAILED");
	}

	logger.info(
		{ tenantId, vitalsId, correctionReason },
		"Vitals updated successfully",
	);

	return {
		id: updatedVitals._id,
		patientId: updatedVitals.patientId,
		notes: updatedVitals.notes,
		correctionReason,
		updatedAt: updatedVitals.updatedAt.toISOString(),
	};
}
