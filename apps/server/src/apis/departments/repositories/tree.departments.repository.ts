import { Department } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("treeDepartments");

/**
 * Lean type for tree node data (subset of DepartmentLean)
 */
export interface DepartmentTreeNode {
	_id: string;
	name: string;
	code: string;
	type: string;
	parentId?: string | null;
}

/**
 * Get all departments for building tree structure
 */
export async function getAllDepartmentsForTree({
	tenantId,
}: {
	tenantId: string;
}): Promise<DepartmentTreeNode[]> {
	try {
		logger.debug({ tenantId }, "Getting all departments for tree");

		const departments = await Department.find({
			tenantId,
			status: "ACTIVE",
		})
			.select("_id name code type parentId")
			.sort({ name: 1 })
			.lean();

		logDatabaseOperation(
			logger,
			"find",
			"department",
			{ tenantId },
			{ count: departments.length },
		);

		return departments as DepartmentTreeNode[];
	} catch (error) {
		logError(logger, error, "Failed to get departments for tree");
		throw error;
	}
}
