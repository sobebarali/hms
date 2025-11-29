import { Department, Role, Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { UpdateUserInput } from "../validations/update.users.validation";

const logger = createRepositoryLogger("updateUser");

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
 * Validate department exists
 */
export async function findDepartmentById({
	tenantId,
	departmentId,
}: {
	tenantId: string;
	departmentId: string;
}) {
	try {
		const department = await Department.findOne({
			_id: departmentId,
			tenantId,
		}).lean();

		return department;
	} catch (error) {
		logError(logger, error, "Failed to find department");
		throw error;
	}
}

/**
 * Validate roles exist
 */
export async function getRolesByIds({
	tenantId,
	roleIds,
}: {
	tenantId: string;
	roleIds: string[];
}) {
	try {
		const roles = await Role.find({
			_id: { $in: roleIds },
			tenantId,
			isActive: true,
		}).lean();

		return roles;
	} catch (error) {
		logError(logger, error, "Failed to find roles");
		throw error;
	}
}

/**
 * Update staff record
 */
export async function updateStaff({
	tenantId,
	staffId,
	data,
}: {
	tenantId: string;
	staffId: string;
	data: UpdateUserInput;
}) {
	try {
		logger.debug({ tenantId, staffId }, "Updating staff");

		const updateData: Record<string, unknown> = {
			updatedAt: new Date(),
		};

		if (data.firstName !== undefined) updateData.firstName = data.firstName;
		if (data.lastName !== undefined) updateData.lastName = data.lastName;
		if (data.phone !== undefined) updateData.phone = data.phone;
		if (data.department !== undefined)
			updateData.departmentId = data.department;
		if (data.roles !== undefined) updateData.roles = data.roles;
		if (data.specialization !== undefined)
			updateData.specialization = data.specialization;
		if (data.shift !== undefined) updateData.shift = data.shift;

		const staff = await Staff.findOneAndUpdate(
			{ _id: staffId, tenantId },
			{ $set: updateData },
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
		logError(logger, error, "Failed to update staff", { tenantId, staffId });
		throw error;
	}
}
