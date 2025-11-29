import { Account, Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("tokenAuth");

/**
 * Find account by user ID and provider (for password verification)
 */
export async function findAccountByUserId({
	userId,
	providerId = "credential",
}: {
	userId: string;
	providerId?: string;
}) {
	try {
		logger.debug({ userId, providerId }, "Finding account by user ID");

		const account = await Account.findOne({ userId, providerId }).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"account",
			{ userId, providerId },
			account ? { found: true } : { found: false },
		);

		return account;
	} catch (error) {
		logError(logger, error, "Failed to find account by user ID");
		throw error;
	}
}

/**
 * Update staff last login
 */
export async function updateStaffLastLogin({ staffId }: { staffId: string }) {
	try {
		logger.debug({ staffId }, "Updating staff last login");

		await Staff.updateOne(
			{ _id: staffId },
			{ $set: { lastLogin: new Date(), updatedAt: new Date() } },
		);

		logDatabaseOperation(
			logger,
			"updateOne",
			"staff",
			{ _id: staffId },
			{ lastLogin: "updated" },
		);
	} catch (error) {
		logError(logger, error, "Failed to update staff last login");
		// Don't throw - this is not critical
	}
}
