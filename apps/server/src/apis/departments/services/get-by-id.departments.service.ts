import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import {
	findStaffById,
	findUserById,
} from "../../users/repositories/shared.users.repository";
import {
	countStaffByDepartmentId,
	findDepartmentById,
	findDepartmentsByParentId,
} from "../repositories/shared.departments.repository";
import type { GetDepartmentByIdOutput } from "../validations/get-by-id.departments.validation";

const logger = createServiceLogger("getDepartmentById");

/**
 * Get department details by ID
 */
export async function getDepartmentByIdService({
	tenantId,
	departmentId,
}: {
	tenantId: string;
	departmentId: string;
}): Promise<GetDepartmentByIdOutput> {
	logger.info({ tenantId, departmentId }, "Getting department by ID");

	// Find the department
	const department = await findDepartmentById({ tenantId, departmentId });
	if (!department) {
		logger.warn({ tenantId, departmentId }, "Department not found");
		throw new NotFoundError("Department not found", "NOT_FOUND");
	}

	// Get head details if present
	let head: GetDepartmentByIdOutput["head"] = null;
	if (department.headId) {
		const headStaff = await findStaffById({
			tenantId,
			staffId: department.headId,
		});
		if (headStaff) {
			// Get user email from User model
			let email = "";
			if (headStaff.userId) {
				const user = await findUserById({ userId: headStaff.userId });
				if (user) {
					email = user.email;
				}
			}
			head = {
				id: String(headStaff._id),
				name: `${headStaff.firstName} ${headStaff.lastName}`,
				email,
			};
		}
	}

	// Get parent department if present
	let parent: GetDepartmentByIdOutput["parent"] = null;
	if (department.parentId) {
		const parentDept = await findDepartmentById({
			tenantId,
			departmentId: department.parentId,
		});
		if (parentDept) {
			parent = {
				id: parentDept._id,
				name: parentDept.name,
				code: parentDept.code,
			};
		}
	}

	// Get child departments
	const childDepts = await findDepartmentsByParentId({
		tenantId,
		parentId: department._id,
	});
	const children = childDepts.map((c) => ({
		id: c._id,
		name: c.name,
		code: c.code,
		type: c.type,
	}));

	// Get staff count
	const staffCount = await countStaffByDepartmentId({
		tenantId,
		departmentId: department._id,
	});

	logger.info(
		{ tenantId, departmentId, staffCount },
		"Department retrieved successfully",
	);

	return {
		id: department._id,
		name: department.name,
		code: department.code,
		description: department.description,
		type: department.type,
		head,
		parent,
		children,
		location: department.location,
		contactPhone: department.contact?.phone,
		contactEmail: department.contact?.email,
		operatingHours: department.operatingHours,
		status: department.status,
		staffCount,
		createdAt: department.createdAt.toISOString(),
		updatedAt: department.updatedAt.toISOString(),
	};
}
