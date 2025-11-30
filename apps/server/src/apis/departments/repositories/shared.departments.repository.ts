import { Department, Patient, Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("sharedDepartments");

// TypeScript interfaces for lean documents
export interface DepartmentLean {
	_id: string;
	tenantId: string;
	name: string;
	code: string;
	description?: string;
	type: string;
	parentId?: string | null;
	headId?: string | null;
	location?: string;
	contact?: {
		phone?: string;
		email?: string;
	};
	operatingHours?: {
		monday?: { start: string; end: string };
		tuesday?: { start: string; end: string };
		wednesday?: { start: string; end: string };
		thursday?: { start: string; end: string };
		friday?: { start: string; end: string };
		saturday?: { start: string; end: string };
		sunday?: { start: string; end: string };
	};
	status: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Find department by ID within a tenant
 */
export async function findDepartmentById({
	tenantId,
	departmentId,
}: {
	tenantId: string;
	departmentId: string;
}): Promise<DepartmentLean | null> {
	try {
		logger.debug({ tenantId, departmentId }, "Finding department by ID");

		const department = await Department.findOne({
			_id: departmentId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"department",
			{ tenantId, departmentId },
			department ? { _id: department._id, found: true } : { found: false },
		);

		return department as DepartmentLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find department by ID");
		throw error;
	}
}

/**
 * Find department by code within a tenant
 */
export async function findDepartmentByCode({
	tenantId,
	code,
}: {
	tenantId: string;
	code: string;
}): Promise<DepartmentLean | null> {
	try {
		logger.debug({ tenantId, code }, "Finding department by code");

		const department = await Department.findOne({
			tenantId,
			code,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"department",
			{ tenantId, code },
			department ? { _id: department._id, found: true } : { found: false },
		);

		return department as DepartmentLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find department by code");
		throw error;
	}
}

/**
 * Find department by name within a tenant
 */
export async function findDepartmentByName({
	tenantId,
	name,
}: {
	tenantId: string;
	name: string;
}): Promise<DepartmentLean | null> {
	try {
		logger.debug({ tenantId, name }, "Finding department by name");

		const department = await Department.findOne({
			tenantId,
			name,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"department",
			{ tenantId, name },
			department ? { _id: department._id, found: true } : { found: false },
		);

		return department as DepartmentLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find department by name");
		throw error;
	}
}

/**
 * Find child departments by parent ID within a tenant
 */
export async function findDepartmentsByParentId({
	tenantId,
	parentId,
}: {
	tenantId: string;
	parentId: string;
}): Promise<DepartmentLean[]> {
	try {
		logger.debug({ tenantId, parentId }, "Finding departments by parent ID");

		const departments = await Department.find({
			tenantId,
			parentId,
			status: "ACTIVE",
		}).lean();

		logDatabaseOperation(
			logger,
			"find",
			"department",
			{ tenantId, parentId },
			{ count: departments.length },
		);

		return departments as DepartmentLean[];
	} catch (error) {
		logError(logger, error, "Failed to find departments by parent ID");
		throw error;
	}
}

/**
 * Count active staff members in a department
 */
export async function countStaffByDepartmentId({
	tenantId,
	departmentId,
}: {
	tenantId: string;
	departmentId: string;
}): Promise<number> {
	try {
		logger.debug({ tenantId, departmentId }, "Counting staff in department");

		const count = await Staff.countDocuments({
			tenantId,
			departmentId,
			status: "ACTIVE",
		});

		logDatabaseOperation(
			logger,
			"countDocuments",
			"staff",
			{ tenantId, departmentId },
			{ count },
		);

		return count;
	} catch (error) {
		logError(logger, error, "Failed to count staff in department");
		throw error;
	}
}

/**
 * Count active patients in a department
 */
export async function countPatientsByDepartmentId({
	tenantId,
	departmentId,
}: {
	tenantId: string;
	departmentId: string;
}): Promise<number> {
	try {
		logger.debug({ tenantId, departmentId }, "Counting patients in department");

		const count = await Patient.countDocuments({
			tenantId,
			departmentId,
			status: "ACTIVE",
		});

		logDatabaseOperation(
			logger,
			"countDocuments",
			"patient",
			{ tenantId, departmentId },
			{ count },
		);

		return count;
	} catch (error) {
		logError(logger, error, "Failed to count patients in department");
		throw error;
	}
}

/**
 * Find multiple departments by IDs within a tenant
 */
export async function findDepartmentsByIds({
	tenantId,
	departmentIds,
}: {
	tenantId: string;
	departmentIds: string[];
}): Promise<DepartmentLean[]> {
	try {
		logger.debug(
			{ tenantId, count: departmentIds.length },
			"Finding departments by IDs",
		);

		const departments = await Department.find({
			_id: { $in: departmentIds },
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"find",
			"department",
			{ tenantId, count: departmentIds.length },
			{ found: departments.length },
		);

		return departments as DepartmentLean[];
	} catch (error) {
		logError(logger, error, "Failed to find departments by IDs");
		throw error;
	}
}

/**
 * Get all departments for a tenant (for tree building)
 */
export async function findAllDepartments({
	tenantId,
	status,
}: {
	tenantId: string;
	status?: string;
}): Promise<DepartmentLean[]> {
	try {
		logger.debug({ tenantId, status }, "Finding all departments");

		const query: Record<string, unknown> = { tenantId };
		if (status) {
			query.status = status;
		}

		const departments = await Department.find(query).lean();

		logDatabaseOperation(
			logger,
			"find",
			"department",
			{ tenantId, status },
			{ count: departments.length },
		);

		return departments as DepartmentLean[];
	} catch (error) {
		logError(logger, error, "Failed to find all departments");
		throw error;
	}
}

/**
 * Check if setting a parent would create a circular reference.
 * Returns true if circular reference would be created, false otherwise.
 *
 * @param tenantId - The tenant ID
 * @param departmentId - The department that would have its parent set (null for new departments)
 * @param parentId - The proposed parent department ID
 */
export async function wouldCreateCircularReference({
	tenantId,
	departmentId,
	parentId,
}: {
	tenantId: string;
	departmentId: string | null;
	parentId: string;
}): Promise<boolean> {
	try {
		logger.debug(
			{ tenantId, departmentId, parentId },
			"Checking for circular reference",
		);

		// For new departments, there's no circular reference possible
		if (!departmentId) {
			return false;
		}

		// If setting self as parent, that's a circular reference
		if (departmentId === parentId) {
			return true;
		}

		// Walk up the tree from parentId to see if we reach departmentId
		const visited = new Set<string>();
		let currentId: string | null = parentId;

		while (currentId) {
			// If we've seen this ID before, there's already a cycle in the data
			if (visited.has(currentId)) {
				logger.warn({ tenantId, currentId }, "Existing cycle detected in data");
				return true;
			}

			// If we reach the department we're trying to update, it's a circular reference
			if (currentId === departmentId) {
				return true;
			}

			visited.add(currentId);

			// Get the parent of the current department
			const currentDept = (await Department.findOne({
				_id: currentId,
				tenantId,
			})
				.select("parentId")
				.lean()) as { parentId?: string | null } | null;

			currentId = currentDept?.parentId ?? null;
		}

		return false;
	} catch (error) {
		logError(logger, error, "Failed to check for circular reference");
		throw error;
	}
}
