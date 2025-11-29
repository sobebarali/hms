import { Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("forcePasswordChange");

/**
 * Set staff status to PASSWORD_EXPIRED
 */
export async function setPasswordExpired({
	tenantId,
	staffId,
}: {
	tenantId: string;
	staffId: string;
}) {
	try {
		logger.debug({ tenantId, staffId }, "Setting password expired");

		const staff = await Staff.findOneAndUpdate(
			{ _id: staffId, tenantId },
			{
				$set: {
					status: "PASSWORD_EXPIRED",
					updatedAt: new Date(),
				},
			},
			{ new: true },
		).lean();

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"staff",
			{ tenantId, staffId },
			staff ? { _id: staff._id, updated: true } : { updated: false },
		);

		return staff;
	} catch (error) {
		logError(logger, error, "Failed to set password expired", {
			tenantId,
			staffId,
		});
		throw error;
	}
}
