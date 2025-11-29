import { Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("deactivateUser");

/**
 * Deactivate staff (soft delete)
 */
export async function deactivateStaff({
	tenantId,
	staffId,
}: {
	tenantId: string;
	staffId: string;
}) {
	try {
		logger.debug({ tenantId, staffId }, "Deactivating staff");

		const now = new Date();
		const staff = await Staff.findOneAndUpdate(
			{ _id: staffId, tenantId },
			{
				$set: {
					status: "INACTIVE",
					deactivatedAt: now,
					updatedAt: now,
				},
			},
			{ new: true },
		).lean();

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"staff",
			{ tenantId, staffId },
			staff ? { _id: staff._id, deactivated: true } : { deactivated: false },
		);

		return staff;
	} catch (error) {
		logError(logger, error, "Failed to deactivate staff", {
			tenantId,
			staffId,
		});
		throw error;
	}
}
