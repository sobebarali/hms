import { Vitals } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { VitalsLean } from "./shared.vitals.repository";

const logger = createRepositoryLogger("updateVitals");

/**
 * Update vitals record notes with correction reason
 */
export async function updateVitalsNotes({
	tenantId,
	vitalsId,
	notes,
	correctionReason,
}: {
	tenantId: string;
	vitalsId: string;
	notes?: string;
	correctionReason: string;
}): Promise<VitalsLean | null> {
	try {
		logger.debug({ tenantId, vitalsId }, "Updating vitals notes");

		const vitals = await Vitals.findOneAndUpdate(
			{ _id: vitalsId, tenantId },
			{
				$set: {
					notes,
					correctionReason,
					updatedAt: new Date(),
				},
			},
			{ new: true },
		).lean();

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"vitals",
			{ tenantId, vitalsId },
			vitals ? { updated: true } : { updated: false },
		);

		return vitals as unknown as VitalsLean | null;
	} catch (error) {
		logError(logger, error, "Failed to update vitals notes", {
			tenantId,
			vitalsId,
		});
		throw error;
	}
}
