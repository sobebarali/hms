import { BadRequestError, ConflictError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import { createDepartment } from "../repositories/create.departments.repository";
import {
	findDepartmentByCode,
	findDepartmentById,
	findDepartmentByName,
} from "../repositories/shared.departments.repository";
import type {
	CreateDepartmentInput,
	CreateDepartmentOutput,
} from "../validations/create.departments.validation";

const logger = createServiceLogger("createDepartment");

/**
 * Create a new department within the hospital tenant
 */
export async function createDepartmentService({
	tenantId,
	data,
}: {
	tenantId: string;
	data: CreateDepartmentInput;
}): Promise<CreateDepartmentOutput> {
	const { name, code, headId, parentId } = data;

	logger.info({ tenantId, code, name }, "Creating new department");

	// Check if code already exists within tenant
	const existingByCode = await findDepartmentByCode({ tenantId, code });
	if (existingByCode) {
		logger.warn({ tenantId, code }, "Department code already exists");
		throw new ConflictError("Department code already exists", "CODE_EXISTS");
	}

	// Check if name already exists within tenant
	const existingByName = await findDepartmentByName({ tenantId, name });
	if (existingByName) {
		logger.warn({ tenantId, name }, "Department name already exists");
		throw new ConflictError("Department name already exists", "NAME_EXISTS");
	}

	// Verify head user exists if provided
	if (headId) {
		const head = await findStaffById({ tenantId, staffId: headId });
		if (!head) {
			logger.warn({ tenantId, headId }, "Head user not found");
			throw new BadRequestError("Head user not found", "INVALID_HEAD");
		}
	}

	// Verify parent department exists if provided
	if (parentId) {
		const parent = await findDepartmentById({
			tenantId,
			departmentId: parentId,
		});
		if (!parent) {
			logger.warn({ tenantId, parentId }, "Parent department not found");
			throw new BadRequestError(
				"Parent department not found",
				"INVALID_PARENT",
			);
		}
	}

	// Create the department
	const department = await createDepartment({ tenantId, data });

	logger.info(
		{ departmentId: department._id, tenantId, code },
		"Department created successfully",
	);

	return {
		id: String(department._id),
		name: department.name,
		code: department.code,
		type: department.type,
		status: department.status,
		createdAt: department.createdAt.toISOString(),
	};
}
