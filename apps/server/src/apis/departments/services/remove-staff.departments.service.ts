import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import {
	getStaffAssignment,
	removeStaffFromDepartment,
} from "../repositories/remove-staff.departments.repository";
import { findDepartmentById } from "../repositories/shared.departments.repository";
import type { RemoveStaffOutput } from "../validations/remove-staff.departments.validation";

const logger = createServiceLogger("removeStaffDepartments");

/**
 * Remove staff from a department
 */
export async function removeStaffService({
	tenantId,
	departmentId,
	userId,
}: {
	tenantId: string;
	departmentId: string;
	userId: string;
}): Promise<RemoveStaffOutput> {
	logger.info(
		{ tenantId, departmentId, userId },
		"Removing staff from department",
	);

	// Verify department exists
	const department = await findDepartmentById({ tenantId, departmentId });
	if (!department) {
		logger.warn({ tenantId, departmentId }, "Department not found");
		throw new NotFoundError("Department not found", "NOT_FOUND");
	}

	// Check if staff is assigned to this department
	const assignment = await getStaffAssignment({
		tenantId,
		staffId: userId,
		departmentId,
	});
	if (!assignment) {
		logger.warn(
			{ tenantId, departmentId, userId },
			"User not assigned to department",
		);
		throw new BadRequestError(
			"User is not assigned to this department",
			"NOT_ASSIGNED",
		);
	}

	// Check if staff is department head
	if (department.headId === userId) {
		logger.warn(
			{ tenantId, departmentId, userId },
			"Cannot remove department head",
		);
		throw new BadRequestError(
			"Cannot remove department head. Reassign head first.",
			"IS_HEAD",
		);
	}

	// Remove staff from department
	await removeStaffFromDepartment({
		tenantId,
		staffId: userId,
		departmentId,
	});

	logger.info(
		{ tenantId, departmentId, userId },
		"Staff removed from department successfully",
	);

	return {
		message: "Staff removed from department successfully",
	};
}
