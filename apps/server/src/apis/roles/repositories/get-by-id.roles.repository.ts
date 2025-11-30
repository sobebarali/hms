import { Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("getRoleById");

/**
 * Get users count for a role
 */
export async function getRoleUsersCount({
	tenantId,
	roleId,
}: {
	tenantId: string;
	roleId: string;
}): Promise<number> {
	try {
		logger.debug({ tenantId, roleId }, "Getting users count for role");

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
			{ count },
		);

		return count;
	} catch (error) {
		logError(logger, error, "Failed to get users count for role");
		throw error;
	}
}
