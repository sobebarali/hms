import { createServiceLogger } from "../../../lib/logger";
import { listUsers } from "../repositories/list.users.repository";
import type {
	ListUsersInput,
	ListUsersOutput,
} from "../validations/list.users.validation";

const logger = createServiceLogger("listUsers");

/**
 * List users within the hospital tenant
 */
export async function listUsersService({
	tenantId,
	query,
}: {
	tenantId: string;
	query: ListUsersInput;
}): Promise<ListUsersOutput> {
	logger.info({ tenantId, query }, "Listing users");

	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 20;
	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder || "desc";

	const result = await listUsers({
		tenantId,
		page,
		limit,
		department: query.department,
		role: query.role,
		status: query.status,
		search: query.search,
		sortBy,
		sortOrder,
	});

	logger.info(
		{
			tenantId,
			page,
			limit,
			total: result.total,
		},
		"Users listed successfully",
	);

	return {
		data: result.data,
		pagination: {
			page: result.page,
			limit: result.limit,
			total: result.total,
			totalPages: result.totalPages,
		},
	};
}
