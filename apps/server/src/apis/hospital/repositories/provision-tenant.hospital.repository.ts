import { Account, Department, DepartmentType, Staff, User } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("provisionTenant");

/**
 * Create admin user with associated account and staff record
 * This is called during tenant provisioning after hospital verification
 */
export async function createAdminUser({
	tenantId,
	adminEmail,
	adminName,
	adminPhone,
	hashedPassword,
	hospitalAdminRoleId,
	adminDepartmentId,
}: {
	tenantId: string;
	adminEmail: string;
	adminName: string;
	adminPhone: string;
	hashedPassword: string;
	hospitalAdminRoleId: string;
	adminDepartmentId: string;
}) {
	try {
		const userId = uuidv4();
		const staffId = uuidv4();
		const accountId = uuidv4();

		logger.debug({ userId, tenantId }, "Creating admin user");

		// Split name into first and last name
		const nameParts = adminName.split(" ");
		const firstName = nameParts[0] || "Admin";
		const lastName = nameParts.slice(1).join(" ") || "User";

		// Create user record
		const user = await User.create({
			_id: userId,
			name: adminName,
			email: adminEmail,
			emailVerified: true, // Admin email is already verified through hospital verification
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		logDatabaseOperation(
			logger,
			"create",
			"user",
			{ tenantId, email: adminEmail },
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

		// Create staff record - admin is the first employee
		const staff = await Staff.create({
			_id: staffId,
			tenantId,
			userId,
			employeeId: "EMP-00001",
			firstName,
			lastName,
			phone: adminPhone,
			departmentId: adminDepartmentId,
			roles: [hospitalAdminRoleId],
			status: "ACTIVE",
			passwordHistory: [hashedPassword],
			forcePasswordChange: true, // Admin should change password on first login
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

		logger.info(
			{ userId, staffId, tenantId },
			"Admin user created successfully",
		);

		return {
			user,
			staff,
			account,
		};
	} catch (error) {
		logError(logger, error, "Failed to create admin user", { tenantId });
		throw error;
	}
}

/**
 * Create default Administration department for tenant
 */
export async function createDefaultDepartment({
	tenantId,
}: {
	tenantId: string;
}) {
	try {
		const departmentId = uuidv4();

		logger.debug({ tenantId }, "Creating default administration department");

		const department = await Department.create({
			_id: departmentId,
			tenantId,
			name: "Administration",
			code: "ADMIN",
			description: "Hospital administration and management department",
			type: DepartmentType.ADMINISTRATIVE,
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		logDatabaseOperation(
			logger,
			"create",
			"department",
			{ tenantId },
			{ _id: department._id },
		);

		logger.info(
			{ departmentId, tenantId },
			"Default department created successfully",
		);

		return department;
	} catch (error) {
		logError(logger, error, "Failed to create default department", {
			tenantId,
		});
		throw error;
	}
}

/**
 * Check if admin user already exists for a tenant
 */
export async function checkAdminExists({
	tenantId,
	adminEmail,
}: {
	tenantId: string;
	adminEmail: string;
}) {
	try {
		logger.debug({ tenantId, adminEmail }, "Checking if admin already exists");

		// Check if user with this email exists
		const user = await User.findOne({ email: adminEmail }).lean();

		if (!user) {
			return false;
		}

		// Check if user is already staff in this tenant
		const staff = await Staff.findOne({
			tenantId,
			userId: String(user._id),
		}).lean();

		return !!staff;
	} catch (error) {
		logError(logger, error, "Failed to check admin existence", { tenantId });
		throw error;
	}
}
