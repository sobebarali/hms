import { randomBytes } from "node:crypto";
import { Hospital, Staff, User, Verification } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("forgotPassword");

/**
 * Find user by email
 */
export async function findUserByEmail({ email }: { email: string }) {
	try {
		logger.debug({ email }, "Finding user by email");

		const user = await User.findOne({ email }).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"user",
			{ email },
			user ? { _id: user._id, found: true } : { found: false },
		);

		return user;
	} catch (error) {
		logError(logger, error, "Failed to find user by email");
		throw error;
	}
}

/**
 * Find staff by user ID and tenant ID
 */
export async function findStaffByUserAndTenant({
	userId,
	tenantId,
}: {
	userId: string;
	tenantId: string;
}) {
	try {
		const staff = await Staff.findOne({ userId, tenantId }).lean();
		return staff;
	} catch (error) {
		logError(logger, error, "Failed to find staff");
		throw error;
	}
}

/**
 * Find hospital by ID
 */
export async function findHospitalById({ hospitalId }: { hospitalId: string }) {
	try {
		const hospital = await Hospital.findById(hospitalId).lean();
		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to find hospital");
		throw error;
	}
}

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
