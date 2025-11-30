import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import {
	assignStaffToDepartment,
	isStaffAssignedToDepartment,
} from "../repositories/assign-staff.departments.repository";
import { findDepartmentById } from "../repositories/shared.departments.repository";
import type {
	AssignStaffBody,
	AssignStaffOutput,
} from "../validations/assign-staff.departments.validation";

const logger = createServiceLogger("assignStaffDepartments");

/**
 * Assign staff to a department
 */
export async function assignStaffService({
	tenantId,
	departmentId,
	data,
}: {
	tenantId: string;
	departmentId: string;
	data: AssignStaffBody;
}): Promise<AssignStaffOutput> {
	const { userId } = data;

	logger.info(
		{ tenantId, departmentId, userId },
		"Assigning staff to department",
	);

	// Verify department exists
	const department = await findDepartmentById({ tenantId, departmentId });
	if (!department) {
		logger.warn({ tenantId, departmentId }, "Department not found");
		throw new NotFoundError("Department not found", "DEPARTMENT_NOT_FOUND");
	}

	// Verify user exists in tenant
	const staff = await findStaffById({ tenantId, staffId: userId });
	if (!staff) {
		logger.warn({ tenantId, userId }, "User not found");
		throw new NotFoundError("User not found", "USER_NOT_FOUND");
	}

	// Check if already assigned
	const isAssigned = await isStaffAssignedToDepartment({
		tenantId,
		staffId: userId,
		departmentId,
	});
	if (isAssigned) {
		logger.warn(
			{ tenantId, departmentId, userId },
			"User already assigned to department",
		);
		throw new BadRequestError(
			"User is already assigned to this department",
			"ALREADY_ASSIGNED",
		);
	}

	// Assign staff to department
	await assignStaffToDepartment({
		tenantId,
		staffId: userId,
		departmentId,
	});

	logger.info(
		{ tenantId, departmentId, userId },
		"Staff assigned to department successfully",
	);

	return {
		userId,
		departmentId,
		assignedAt: new Date().toISOString(),
	};
}
