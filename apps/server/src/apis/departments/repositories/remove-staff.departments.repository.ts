import { Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("removeStaffDepartments");

/**
 * Get staff assignment details
 */
export async function getStaffAssignment({
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
			"Getting staff assignment",
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
			staff ? { found: true } : { found: false },
		);

		return staff;
	} catch (error) {
		logError(logger, error, "Failed to get staff assignment");
		throw error;
	}
}

/**
 * Remove staff from department (set departmentId to null)
 * Staff will be unassigned from the department and can be reassigned later.
 */
export async function removeStaffFromDepartment({
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
			"Removing staff from department",
		);

		const staff = await Staff.findOneAndUpdate(
			{ _id: staffId, tenantId, departmentId },
			{
				$set: {
					departmentId: null,
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
			staff ? { removed: true } : { removed: false },
		);

		return staff;
	} catch (error) {
		logError(logger, error, "Failed to remove staff from department");
		throw error;
	}
}
