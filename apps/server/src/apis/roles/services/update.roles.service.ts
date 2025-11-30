import { ConflictError, ForbiddenError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import {
	findRoleById,
	findRoleByName,
} from "../repositories/shared.roles.repository";
import { updateRole } from "../repositories/update.roles.repository";
import type {
	UpdateRoleInput,
	UpdateRoleOutput,
} from "../validations/update.roles.validation";

const logger = createServiceLogger("updateRole");

/**
 * Update a role
 */
export async function updateRoleService({
	tenantId,
	roleId,
	data,
	userPermissions,
}: {
	tenantId: string;
	roleId: string;
	data: UpdateRoleInput;
	userPermissions: string[];
}): Promise<UpdateRoleOutput> {
	logger.info({ tenantId, roleId }, "Updating role");

	// Find the existing role
	const existingRole = await findRoleById({ tenantId, roleId });

	if (!existingRole) {
		logger.warn({ tenantId, roleId }, "Role not found");
		throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");
	}

	// Check if it's a system role
	if (existingRole.isSystem) {
		logger.warn({ tenantId, roleId }, "Cannot modify system role");
		throw new ForbiddenError("Cannot modify system roles", "SYSTEM_ROLE");
	}

	// Check if name is being changed and if it already exists
	if (data.name && data.name !== existingRole.name) {
		const roleWithSameName = await findRoleByName({
			tenantId,
			name: data.name,
		});
		if (roleWithSameName) {
			logger.warn({ tenantId, name: data.name }, "Role name already exists");
			throw new ConflictError(
				"A role with this name already exists",
				"ROLE_EXISTS",
			);
		}
	}

	// Validate permissions if being updated
	if (data.permissions) {
		const missingPermissions = data.permissions.filter(
			(perm) =>
				!userPermissions.includes(perm) &&
				!userPermissions.includes(`${perm.split(":")[0]}:MANAGE`),
		);

		if (missingPermissions.length > 0) {
			logger.warn(
				{ tenantId, roleId, missingPermissions },
				"User attempted to grant permissions they don't have",
			);
			throw new ForbiddenError(
				"You cannot grant permissions you don't have",
				"PERMISSION_DENIED",
			);
		}
	}

	// Build update data
	const updateData: {
		name?: string;
		description?: string;
		permissions?: string[];
	} = {};
	if (data.name !== undefined) updateData.name = data.name;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.permissions !== undefined) updateData.permissions = data.permissions;

	// Update the role
	const updatedRole = await updateRole({
		tenantId,
		roleId,
		data: updateData,
	});

	if (!updatedRole) {
		throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");
	}

	logger.info({ tenantId, roleId }, "Role updated successfully");

	return {
		id: String(updatedRole._id),
		name: updatedRole.name,
		description: updatedRole.description || undefined,
		permissions: updatedRole.permissions || [],
		isSystem: updatedRole.isSystem || false,
		isActive: updatedRole.isActive ?? true,
		tenantId: String(updatedRole.tenantId),
		createdAt: updatedRole.createdAt?.toISOString() || new Date().toISOString(),
		updatedAt: updatedRole.updatedAt?.toISOString() || new Date().toISOString(),
	};
}
