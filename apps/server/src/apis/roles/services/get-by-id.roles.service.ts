import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { getRoleUsersCount } from "../repositories/get-by-id.roles.repository";
import { findRoleById } from "../repositories/shared.roles.repository";
import type { GetRoleByIdOutput } from "../validations/get-by-id.roles.validation";

const logger = createServiceLogger("getRoleById");

/**
 * Get role by ID
 */
export async function getRoleByIdService({
	tenantId,
	roleId,
}: {
	tenantId: string;
	roleId: string;
}): Promise<GetRoleByIdOutput> {
	logger.info({ tenantId, roleId }, "Getting role by ID");

	const role = await findRoleById({ tenantId, roleId });

	if (!role) {
		logger.warn({ tenantId, roleId }, "Role not found");
		throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");
	}

	const usersCount = await getRoleUsersCount({ tenantId, roleId });

	logger.info({ tenantId, roleId, usersCount }, "Role retrieved successfully");

	return {
		id: String(role._id),
		name: role.name,
		description: role.description || undefined,
		permissions: role.permissions || [],
		isSystem: role.isSystem || false,
		isActive: role.isActive ?? true,
		usersCount,
		tenantId: String(role.tenantId),
		createdAt: role.createdAt?.toISOString() || new Date().toISOString(),
		updatedAt: role.updatedAt?.toISOString() || new Date().toISOString(),
	};
}
