import { randomBytes } from "node:crypto";
import { Verification } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("forgotPassword");

/**
 * Create password reset token
 */
export async function createResetToken({
	userId,
	email,
}: {
	userId: string;
	email: string;
}) {
	try {
		logger.debug({ userId }, "Creating reset token");

		// Delete any existing reset tokens for this user
		await Verification.deleteMany({ identifier: email });

		// Generate new token
		const token = randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		const verification = await Verification.create({
			_id: uuidv4(),
			identifier: email,
			value: token,
			expiresAt,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		logDatabaseOperation(
			logger,
			"create",
			"verification",
			{ userId, email },
			{ _id: verification._id },
		);

		logger.info({ userId }, "Reset token created");

		return token;
	} catch (error) {
		logError(logger, error, "Failed to create reset token", { userId });
		throw error;
	}
}
