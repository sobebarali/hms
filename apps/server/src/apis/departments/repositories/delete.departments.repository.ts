import { Department } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("deleteDepartment");

/**
 * Deactivate a department (soft delete)
 */
export async function deactivateDepartment({
	tenantId,
	departmentId,
}: {
	tenantId: string;
	departmentId: string;
}) {
	try {
		logger.debug({ tenantId, departmentId }, "Deactivating department");

		const now = new Date();

		const department = await Department.findOneAndUpdate(
			{ _id: departmentId, tenantId },
			{
				$set: {
					status: "INACTIVE",
					updatedAt: now,
				},
			},
			{ new: true },
		).lean();

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"department",
			{ tenantId, departmentId },
			department
				? { _id: department._id, status: "INACTIVE" }
				: { deactivated: false },
		);

		return department;
	} catch (error) {
		logError(logger, error, "Failed to deactivate department");
		throw error;
	}
}
