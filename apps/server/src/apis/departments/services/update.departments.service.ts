import { BadRequestError, ConflictError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import {
	findDepartmentById,
	findDepartmentByName,
	wouldCreateCircularReference,
} from "../repositories/shared.departments.repository";
import { updateDepartment } from "../repositories/update.departments.repository";
import type {
	UpdateDepartmentBody,
	UpdateDepartmentOutput,
} from "../validations/update.departments.validation";

const logger = createServiceLogger("updateDepartment");

/**
 * Update a department
 */
export async function updateDepartmentService({
	tenantId,
	departmentId,
	data,
}: {
	tenantId: string;
	departmentId: string;
	data: UpdateDepartmentBody;
}): Promise<UpdateDepartmentOutput> {
	logger.info({ tenantId, departmentId }, "Updating department");

	// Find the department
	const existing = await findDepartmentById({ tenantId, departmentId });
	if (!existing) {
		logger.warn({ tenantId, departmentId }, "Department not found");
		throw new NotFoundError("Department not found", "NOT_FOUND");
	}

	// Check name uniqueness if name is being changed
	if (data.name && data.name !== existing.name) {
		const existingByName = await findDepartmentByName({
			tenantId,
			name: data.name,
		});
		if (existingByName && existingByName._id !== departmentId) {
			logger.warn(
				{ tenantId, name: data.name },
				"Department name already exists",
			);
			throw new ConflictError("Department name already exists", "NAME_EXISTS");
		}
	}

	// Verify head user exists if provided
	if (data.headId) {
		const head = await findStaffById({ tenantId, staffId: data.headId });
		if (!head) {
			logger.warn({ tenantId, headId: data.headId }, "Head user not found");
			throw new BadRequestError("Head user not found", "INVALID_HEAD");
		}
	}

	// Verify parent department exists and check for circular reference if parentId is being changed
	if (data.parentId !== undefined) {
		if (data.parentId !== null) {
			const parent = await findDepartmentById({
				tenantId,
				departmentId: data.parentId,
			});
			if (!parent) {
				logger.warn(
					{ tenantId, parentId: data.parentId },
					"Parent department not found",
				);
				throw new BadRequestError(
					"Parent department not found",
					"INVALID_PARENT",
				);
			}

			// Check for circular reference
			const wouldCycle = await wouldCreateCircularReference({
				tenantId,
				departmentId,
				parentId: data.parentId,
			});
			if (wouldCycle) {
				logger.warn(
					{ tenantId, departmentId, parentId: data.parentId },
					"Circular reference detected",
				);
				throw new BadRequestError(
					"Cannot set parent: would create a circular reference",
					"CIRCULAR_REFERENCE",
				);
			}
		}
	}

	// Update the department
	const updated = await updateDepartment({
		tenantId,
		departmentId,
		data,
	});

	if (!updated) {
		throw new NotFoundError("Department not found", "NOT_FOUND");
	}

	logger.info({ tenantId, departmentId }, "Department updated successfully");

	return {
		id: String(updated._id),
		name: updated.name,
		code: updated.code,
		description: updated.description ?? undefined,
		type: updated.type,
		headId: updated.headId ?? undefined,
		parentId: updated.parentId ?? undefined,
		location: updated.location ?? undefined,
		contactPhone: updated.contact?.phone ?? undefined,
		contactEmail: updated.contact?.email ?? undefined,
		status: updated.status,
		updatedAt: updated.updatedAt.toISOString(),
	};
}
