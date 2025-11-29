import { Account, Session, Staff, User, Verification } from "@hms/db";
import bcrypt from "bcryptjs";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("resetPassword");

/**
 * Find and validate reset token
 */
export async function findValidResetToken({ token }: { token: string }) {
	try {
		logger.debug("Finding reset token");

		const verification = await Verification.findOne({ value: token }).lean();

		if (!verification) {
			return null;
		}

		// Check if expired
		if (new Date(verification.expiresAt) < new Date()) {
			await Verification.deleteOne({ _id: verification._id });
			return { expired: true, verification: null };
		}

		return { expired: false, verification };
	} catch (error) {
		logError(logger, error, "Failed to find reset token");
		throw error;
	}
}

/**
 * Find user by email
 */
export async function findUserByEmail({ email }: { email: string }) {
	try {
		const user = await User.findOne({ email }).lean();
		return user;
	} catch (error) {
		logError(logger, error, "Failed to find user by email");
		throw error;
	}
}

/**
 * Find staff by user ID
 */
export async function findStaffByUserId({ userId }: { userId: string }) {
	try {
		const staff = await Staff.findOne({ userId }).lean();
		return staff;
	} catch (error) {
		logError(logger, error, "Failed to find staff");
		throw error;
	}
}

/**
 * Update password and add to history
 */
export async function updatePassword({
	userId,
	hashedPassword,
	staffId,
}: {
	userId: string;
	hashedPassword: string;
	staffId: string;
}) {
	try {
		logger.debug({ userId }, "Updating password");

		// Update account password
		const account = await Account.findOneAndUpdate(
			{ userId, providerId: "credential" },
			{
				$set: {
					password: hashedPassword,
					updatedAt: new Date(),
				},
			},
			{ new: true },
		);

		if (!account) {
			throw new Error("Account not found");
		}

		// Update staff password history
		await Staff.findByIdAndUpdate(staffId, {
			$push: {
				passwordHistory: {
					$each: [hashedPassword],
					$slice: -3, // Keep only last 3 passwords
				},
			},
			$set: {
				status: "ACTIVE", // Reset status if it was PASSWORD_EXPIRED
				updatedAt: new Date(),
			},
		});

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"account",
			{ userId },
			{ updated: true },
		);

		return account;
	} catch (error) {
		logError(logger, error, "Failed to update password", { userId });
		throw error;
	}
}

/**
 * Check password against history
 */
export async function checkPasswordHistory({
	staffId,
	newPassword,
}: {
	staffId: string;
	newPassword: string;
}): Promise<boolean> {
	try {
		const staff = await Staff.findById(staffId).lean();
		if (!staff || !staff.passwordHistory) {
			return false;
		}

		// Check if new password matches any of the last 3 passwords
		for (const oldHash of staff.passwordHistory) {
			const matches = await bcrypt.compare(newPassword, oldHash as string);
			if (matches) {
				return true;
			}
		}

		return false;
	} catch (error) {
		logError(logger, error, "Failed to check password history");
		throw error;
	}
}

/**
 * Delete reset token
 */
export async function deleteResetToken({ token }: { token: string }) {
	try {
		await Verification.deleteOne({ value: token });
		logger.debug("Reset token deleted");
	} catch (error) {
		logError(logger, error, "Failed to delete reset token");
		throw error;
	}
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateUserSessions({ userId }: { userId: string }) {
	try {
		const result = await Session.deleteMany({ userId });
		logger.info(
			{ userId, count: result.deletedCount },
			"User sessions invalidated",
		);
		return result.deletedCount;
	} catch (error) {
		logError(logger, error, "Failed to invalidate sessions", { userId });
		throw error;
	}
}
