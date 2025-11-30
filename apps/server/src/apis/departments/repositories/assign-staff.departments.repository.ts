import { Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("assignStaffDepartments");

/**
 * Check if staff is already assigned to a department
 */
export async function isStaffAssignedToDepartment({
	tenantId,
	staffId,
	departmentId,
}: {
	tenantId: string;
	staffId: string;
	departmentId: string;
}): Promise<boolean> {
	try {
		logger.debug(
			{ tenantId, staffId, departmentId },
			"Checking staff assignment",
		);

		const staff = await Staff.findOne({
			_id: staffId,
			tenantId,
			departmentId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"staff",
			{ tenantId, staffId, departmentId },
			{ isAssigned: !!staff },
		);

		return !!staff;
	} catch (error) {
		logError(logger, error, "Failed to check staff assignment");
		throw error;
	}
}

/**
 * Assign staff to a department
 */
export async function assignStaffToDepartment({
	tenantId,
	staffId,
	departmentId,
}: {
	tenantId: string;
	staffId: string;
	departmentId: string;
}) {
	try {
		logger.debug(
			{ tenantId, staffId, departmentId },
			"Assigning staff to department",
		);

		const staff = await Staff.findOneAndUpdate(
			{ _id: staffId, tenantId },
			{
				$set: {
					departmentId,
					updatedAt: new Date(),
				},
			},
			{ new: true },
		).lean();

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"staff",
			{ tenantId, staffId, departmentId },
			staff ? { _id: staff._id, assigned: true } : { assigned: false },
		);

		return staff;
	} catch (error) {
		logError(logger, error, "Failed to assign staff to department");
		throw error;
	}
}
