import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import {
	deactivateRole,
	isRoleInUse,
} from "../repositories/delete.roles.repository";
import { findRoleById } from "../repositories/shared.roles.repository";
import type { DeleteRoleOutput } from "../validations/delete.roles.validation";

const logger = createServiceLogger("deleteRole");

/**
 * Delete (deactivate) a role
 */
export async function deleteRoleService({
	tenantId,
	roleId,
}: {
	tenantId: string;
	roleId: string;
}): Promise<DeleteRoleOutput> {
	logger.info({ tenantId, roleId }, "Deleting role");

	// Find the existing role
	const existingRole = await findRoleById({ tenantId, roleId });

	if (!existingRole) {
		logger.warn({ tenantId, roleId }, "Role not found");
		throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");
	}

	// Check if it's a system role
	if (existingRole.isSystem) {
		logger.warn({ tenantId, roleId }, "Cannot delete system role");
		throw new ForbiddenError("Cannot delete system roles", "SYSTEM_ROLE");
	}

	// Check if role is assigned to any users
	const inUse = await isRoleInUse({ tenantId, roleId });
	if (inUse) {
		logger.warn({ tenantId, roleId }, "Role is assigned to active users");
		throw new BadRequestError(
			"Cannot delete role assigned to active users. Reassign users first.",
			"ROLE_IN_USE",
		);
	}

	// Deactivate the role
	const deactivatedRole = await deactivateRole({ tenantId, roleId });

	if (!deactivatedRole) {
		throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");
	}

	logger.info({ tenantId, roleId }, "Role deactivated successfully");

	return {
		id: String(deactivatedRole._id),
		name: deactivatedRole.name,
		isActive: false,
		deactivatedAt: new Date().toISOString(),
	};
}
