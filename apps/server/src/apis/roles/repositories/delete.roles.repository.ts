import { Role, Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("deleteRole");

interface RoleLean {
	_id: string;
	tenantId: string;
	name: string;
	description?: string;
	permissions: string[];
	isSystem: boolean;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Check if role is assigned to any active users
 */
export async function isRoleInUse({
	tenantId,
	roleId,
}: {
	tenantId: string;
	roleId: string;
}): Promise<boolean> {
	try {
		logger.debug({ tenantId, roleId }, "Checking if role is in use");

		const count = await Staff.countDocuments({
			tenantId,
			roles: roleId,
			status: "ACTIVE",
		});

		logDatabaseOperation(
			logger,
			"countDocuments",
			"staff",
			{ tenantId, roleId },
			{ count, inUse: count > 0 },
		);

		return count > 0;
	} catch (error) {
		logError(logger, error, "Failed to check if role is in use");
		throw error;
	}
}

/**
 * Deactivate a role (soft delete)
 */
export async function deactivateRole({
	tenantId,
	roleId,
}: {
	tenantId: string;
	roleId: string;
}): Promise<RoleLean | null> {
	try {
		logger.debug({ tenantId, roleId }, "Deactivating role");

		const role = await Role.findOneAndUpdate(
			{ _id: roleId, tenantId },
			{ $set: { isActive: false } },
			{ new: true },
		).lean();

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"role",
			{ _id: roleId, tenantId },
			role ? { _id: role._id, deactivated: true } : { deactivated: false },
		);

		return role as RoleLean | null;
	} catch (error) {
		logError(logger, error, "Failed to deactivate role");
		throw error;
	}
}
