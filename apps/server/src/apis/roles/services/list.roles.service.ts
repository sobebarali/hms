import { createServiceLogger } from "../../../lib/logger";
import { listRoles } from "../repositories/list.roles.repository";
import type {
	ListRolesInput,
	ListRolesOutput,
	RoleListItem,
} from "../validations/list.roles.validation";

const logger = createServiceLogger("listRoles");

/**
 * List roles with pagination and filters
 */
export async function listRolesService({
	tenantId,
	query,
}: {
	tenantId: string;
	query: ListRolesInput;
}): Promise<ListRolesOutput> {
	const page = query.page ?? 1;
	const limit = query.limit ?? 20;

	logger.info({ tenantId, page, limit, filters: query }, "Listing roles");

	const { roles, total } = await listRoles({
		tenantId,
		page,
		limit,
		search: query.search,
		isSystem: query.isSystem,
		isActive: query.isActive,
		sortBy: query.sortBy,
		sortOrder: query.sortOrder,
	});

	const data: RoleListItem[] = roles.map((r) => ({
		id: String(r._id),
		name: r.name,
		description: r.description,
		permissions: r.permissions || [],
		isSystem: r.isSystem,
		isActive: r.isActive,
		usersCount: r.usersCount,
		createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
	}));

	const totalPages = Math.ceil(total / limit);

	logger.info(
		{ tenantId, total, returned: data.length },
		"Roles listed successfully",
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
