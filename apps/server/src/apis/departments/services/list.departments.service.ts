import { createServiceLogger } from "../../../lib/logger";
import { listDepartments } from "../repositories/list.departments.repository";
import type {
	DepartmentListItem,
	ListDepartmentsInput,
	ListDepartmentsOutput,
} from "../validations/list.departments.validation";

const logger = createServiceLogger("listDepartments");

/**
 * List departments with pagination and filters
 */
export async function listDepartmentsService({
	tenantId,
	query,
}: {
	tenantId: string;
	query: ListDepartmentsInput;
}): Promise<ListDepartmentsOutput> {
	const page = query.page ?? 1;
	const limit = query.limit ?? 50;

	logger.info({ tenantId, page, limit, filters: query }, "Listing departments");

	const { departments, total } = await listDepartments({
		tenantId,
		page,
		limit,
		type: query.type,
		status: query.status,
		parentId: query.parentId,
		search: query.search,
		includeStaffCount: query.includeStaffCount,
	});

	const data: DepartmentListItem[] = departments.map((d) => ({
		id: d._id,
		name: d.name,
		code: d.code,
		type: d.type,
		head: d.headDetails
			? {
					id: d.headDetails._id,
					name: `${d.headDetails.firstName} ${d.headDetails.lastName}`,
				}
			: null,
		location: d.location,
		status: d.status,
		staffCount: d.staffCount,
	}));

	const totalPages = Math.ceil(total / limit);

	logger.info(
		{ tenantId, total, returned: data.length },
		"Departments listed successfully",
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
