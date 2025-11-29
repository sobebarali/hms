import { Account, Department, Hospital, Role, Staff, User } from "@hms/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { CreateUserInput } from "../validations/create.users.validation";

const logger = createRepositoryLogger("createUser");

/**
 * Check if email already exists within the tenant
 */
export async function findStaffByEmail({
	tenantId,
	email,
}: {
	tenantId: string;
	email: string;
}) {
	try {
		logger.debug({ tenantId, email }, "Checking for existing staff by email");

		// First find user by email
		const user = await User.findOne({ email }).lean();
		if (!user) {
			return null;
		}

		// Then check if user is staff in this tenant
		const staff = await Staff.findOne({
			tenantId,
			userId: String(user._id),
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"staff",
			{ tenantId, email },
			staff ? { _id: staff._id, found: true } : { found: false },
		);

		return staff;
	} catch (error) {
		logError(logger, error, "Failed to check for existing staff by email");
		throw error;
	}
}

/**
 * Get hospital by ID to retrieve domain for username generation
 */
export async function findHospitalById({ hospitalId }: { hospitalId: string }) {
	try {
		logger.debug({ hospitalId }, "Finding hospital by ID");

		const hospital = await Hospital.findById(hospitalId).lean();

		logDatabaseOperation(
			logger,
			"findById",
			"hospital",
			{ hospitalId },
			hospital ? { _id: hospital._id, found: true } : { found: false },
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to find hospital");
		throw error;
	}
}

/**
 * Find department by ID
 */
export async function findDepartmentById({
	tenantId,
	departmentId,
}: {
	tenantId: string;
	departmentId: string;
}) {
	try {
		logger.debug({ tenantId, departmentId }, "Finding department by ID");

		const department = await Department.findOne({
			_id: departmentId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"department",
			{ tenantId, departmentId },
			department ? { _id: department._id, found: true } : { found: false },
		);

		return department;
	} catch (error) {
		logError(logger, error, "Failed to find department");
		throw error;
	}
}

/**
 * Get roles by IDs and verify they belong to the tenant
 */
export async function getRolesByIds({
	tenantId,
	roleIds,
}: {
	tenantId: string;
	roleIds: string[];
}) {
	try {
		logger.debug({ tenantId, roleIds }, "Finding roles by IDs");

		const roles = await Role.find({
			_id: { $in: roleIds },
			tenantId,
			isActive: true,
		}).lean();

		logDatabaseOperation(
			logger,
			"find",
			"role",
			{ tenantId, roleIds },
			{ count: roles.length },
		);

		return roles;
	} catch (error) {
		logError(logger, error, "Failed to find roles");
		throw error;
	}
}

/**
 * Create a new user with associated account and staff record
 */
export async function createUser({
	tenantId,
	data,
	hashedPassword,
}: {
	tenantId: string;
	data: CreateUserInput;
	hashedPassword: string;
}) {
	try {
		const userId = uuidv4();
		const staffId = uuidv4();
		const accountId = uuidv4();

		logger.debug({ userId, tenantId }, "Creating user");

		// Create user record
		const user = await User.create({
			_id: userId,
			name: `${data.firstName} ${data.lastName}`,
			email: data.email,
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		logDatabaseOperation(
			logger,
			"create",
			"user",
			{ tenantId, email: data.email },
			{ _id: user._id },
		);

		// Create account record with password
		const account = await Account.create({
			_id: accountId,
			accountId: accountId,
			userId: userId,
			providerId: "credential",
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		logDatabaseOperation(
			logger,
			"create",
			"account",
			{ userId },
			{ _id: account._id },
		);

		// Generate employee ID
		const employeeCount = await Staff.countDocuments({ tenantId });
		const employeeId = `EMP-${String(employeeCount + 1).padStart(5, "0")}`;

		// Create staff record
		const staff = await Staff.create({
			_id: staffId,
			tenantId,
			userId,
			employeeId,
			firstName: data.firstName,
			lastName: data.lastName,
			phone: data.phone,
			departmentId: data.department,
			roles: data.roles,
			specialization: data.specialization,
			shift: data.shift,
			status: "ACTIVE",
			passwordHistory: [hashedPassword],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		logDatabaseOperation(
			logger,
			"create",
			"staff",
			{ tenantId, userId },
			{ _id: staff._id },
		);

		logger.info({ userId, staffId, tenantId }, "User created successfully");

		return {
			user,
			staff,
			account,
		};
	} catch (error) {
		logError(logger, error, "Failed to create user", { tenantId });
		throw error;
	}
}

/**
 * Generate a temporary password
 */
export function generateTemporaryPassword(): string {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&";
	let password = "";

	// Ensure at least one of each required type
	password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
	password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
	password += "0123456789"[Math.floor(Math.random() * 10)];
	password += "@$!%*?&"[Math.floor(Math.random() * 7)];

	// Fill the rest
	for (let i = 4; i < 12; i++) {
		password += chars[Math.floor(Math.random() * chars.length)];
	}

	// Shuffle the password
	return password
		.split("")
		.sort(() => Math.random() - 0.5)
		.join("");
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10);
}
