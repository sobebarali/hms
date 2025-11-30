import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { getStaffByDepartmentId } from "../repositories/get-staff.departments.repository";
import { findDepartmentById } from "../repositories/shared.departments.repository";
import type {
	GetStaffOutput,
	GetStaffQuery,
} from "../validations/get-staff.departments.validation";

const logger = createServiceLogger("getStaffDepartments");

/**
 * Get staff members in a department
 */
export async function getStaffService({
	tenantId,
	departmentId,
	query,
}: {
	tenantId: string;
	departmentId: string;
	query: GetStaffQuery;
}): Promise<GetStaffOutput> {
	const page = query.page ?? 1;
	const limit = query.limit ?? 20;

	logger.info(
		{ tenantId, departmentId, page, limit },
		"Getting department staff",
	);

	// Verify department exists
	const department = await findDepartmentById({ tenantId, departmentId });
	if (!department) {
		logger.warn({ tenantId, departmentId }, "Department not found");
		throw new NotFoundError("Department not found", "NOT_FOUND");
	}

	// Get staff
	const { staff, total } = await getStaffByDepartmentId({
		tenantId,
		departmentId,
		page,
		limit,
		role: query.role,
		status: query.status,
	});

	const data = staff.map((s) => ({
		id: s._id,
		name: `${s.firstName} ${s.lastName}`,
		email: s.email || "",
		role: s.roleName || "Unknown",
		specialization: s.specialization ?? undefined,
		status: s.status,
		assignedAt: s.createdAt.toISOString(),
	}));

	const totalPages = Math.ceil(total / limit);

	logger.info(
		{ tenantId, departmentId, total, returned: data.length },
		"Department staff retrieved successfully",
	);

	return {
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages,
		},
	};
}
