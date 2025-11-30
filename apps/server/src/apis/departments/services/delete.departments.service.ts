import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { deactivateDepartment } from "../repositories/delete.departments.repository";
import {
	countPatientsByDepartmentId,
	countStaffByDepartmentId,
	findDepartmentById,
	findDepartmentsByParentId,
} from "../repositories/shared.departments.repository";
import type { DeleteDepartmentOutput } from "../validations/delete.departments.validation";

const logger = createServiceLogger("deleteDepartment");

/**
 * Deactivate a department (soft delete)
 */
export async function deleteDepartmentService({
	tenantId,
	departmentId,
}: {
	tenantId: string;
	departmentId: string;
}): Promise<DeleteDepartmentOutput> {
	logger.info({ tenantId, departmentId }, "Deleting department");

	// Find the department
	const department = await findDepartmentById({ tenantId, departmentId });
	if (!department) {
		logger.warn({ tenantId, departmentId }, "Department not found");
		throw new NotFoundError("Department not found", "NOT_FOUND");
	}

	// Check for active staff
	const staffCount = await countStaffByDepartmentId({ tenantId, departmentId });
	if (staffCount > 0) {
		logger.warn(
			{ tenantId, departmentId, staffCount },
			"Cannot delete department with active staff",
		);
		throw new BadRequestError(
			"Cannot delete department with assigned staff. Reassign staff first.",
			"HAS_ACTIVE_STAFF",
		);
	}

	// Check for active patients
	const patientCount = await countPatientsByDepartmentId({
		tenantId,
		departmentId,
	});
	if (patientCount > 0) {
		logger.warn(
			{ tenantId, departmentId, patientCount },
			"Cannot delete department with active patients",
		);
		throw new BadRequestError(
			"Cannot delete department with active patients. Reassign patients first.",
			"HAS_ACTIVE_PATIENTS",
		);
	}

	// Check for child departments
	const children = await findDepartmentsByParentId({
		tenantId,
		parentId: departmentId,
	});
	if (children.length > 0) {
		logger.warn(
			{ tenantId, departmentId, childCount: children.length },
			"Cannot delete department with child departments",
		);
		throw new BadRequestError(
			"Cannot delete department with child departments. Delete child departments first.",
			"HAS_CHILDREN",
		);
	}

	// Deactivate the department
	const deactivated = await deactivateDepartment({ tenantId, departmentId });

	if (!deactivated) {
		throw new NotFoundError("Department not found", "NOT_FOUND");
	}

	logger.info(
		{ tenantId, departmentId },
		"Department deactivated successfully",
	);

	return {
		id: String(deactivated._id),
		status: deactivated.status,
		deactivatedAt: deactivated.updatedAt.toISOString(),
	};
}
