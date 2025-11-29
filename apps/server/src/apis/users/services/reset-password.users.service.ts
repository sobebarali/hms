import bcrypt from "bcryptjs";
import { invalidateAllUserSessions } from "../../../lib/cache/auth.cache";
import { createServiceLogger } from "../../../lib/logger";
import {
	checkPasswordHistory,
	deleteResetToken,
	findValidResetToken,
	updatePassword,
} from "../repositories/reset-password.users.repository";
import {
	findStaffByUserId,
	findUserByEmail,
	invalidateUserSessions,
} from "../repositories/shared.users.repository";
import type {
	ResetPasswordInput,
	ResetPasswordOutput,
} from "../validations/reset-password.users.validation";

const logger = createServiceLogger("resetPassword");

/**
 * Reset password using token
 */
export async function resetPasswordService({
	data,
}: {
	data: ResetPasswordInput;
}): Promise<ResetPasswordOutput> {
	const { token, newPassword } = data;

	logger.info("Password reset attempt");

	// Find and validate token
	const result = await findValidResetToken({ token });
	if (!result || !result.verification) {
		if (result?.expired) {
			logger.warn("Reset token expired");
			throw {
				status: 400,
				code: "TOKEN_EXPIRED",
				message:
					"Reset token has expired. Please request a new password reset.",
			};
		}

		logger.warn("Invalid reset token");
		throw {
			status: 400,
			code: "INVALID_TOKEN",
			message: "Invalid or expired reset token",
		};
	}

	const email = result.verification.identifier;

	// Find user
	const user = await findUserByEmail({ email });
	if (!user) {
		logger.warn("User not found for reset token");
		throw {
			status: 400,
			code: "INVALID_TOKEN",
			message: "Invalid reset token",
		};
	}

	// Find staff record
	const staff = await findStaffByUserId({ userId: String(user._id) });
	if (!staff) {
		logger.warn("Staff not found for user");
		throw {
			status: 400,
			code: "INVALID_TOKEN",
			message: "Invalid reset token",
		};
	}

	// Check password history
	const isReused = await checkPasswordHistory({
		staffId: String(staff._id),
		newPassword,
	});

	if (isReused) {
		logger.warn("Password reuse attempt");
		throw {
			status: 400,
			code: "PASSWORD_REUSE",
			message: "Cannot reuse any of your last 3 passwords",
		};
	}

	// Hash new password
	const hashedPassword = await bcrypt.hash(newPassword, 10);

	// Update password
	await updatePassword({
		userId: String(user._id),
		hashedPassword,
		staffId: String(staff._id),
	});

	// Delete reset token
	await deleteResetToken({ token });

	// Invalidate all sessions
	await invalidateUserSessions({ userId: String(user._id) });
	await invalidateAllUserSessions({ userId: String(user._id) });

	logger.info({ userId: user._id }, "Password reset successfully");

	return {
		message:
			"Password has been reset successfully. Please log in with your new password.",
	};
}
