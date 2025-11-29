import { Session, Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("deactivateUser");

/**
 * Find staff by ID
 */
export async function findStaffById({
	tenantId,
	staffId,
}: {
	tenantId: string;
	staffId: string;
}) {
	try {
		logger.debug({ tenantId, staffId }, "Finding staff by ID");

		const staff = await Staff.findOne({
			_id: staffId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"staff",
			{ tenantId, staffId },
			staff ? { _id: staff._id, found: true } : { found: false },
		);

		return staff;
	} catch (error) {
		logError(logger, error, "Failed to find staff by ID");
		throw error;
	}
}

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

/**
 * Invalidate all sessions for a user
 */
export async function invalidateUserSessions({ userId }: { userId: string }) {
	try {
		logger.debug({ userId }, "Invalidating user sessions");

		const result = await Session.deleteMany({ userId });

		logDatabaseOperation(
			logger,
			"deleteMany",
			"session",
			{ userId },
			{ deletedCount: result.deletedCount },
		);

		return result.deletedCount;
	} catch (error) {
		logError(logger, error, "Failed to invalidate user sessions", { userId });
		throw error;
	}
}
