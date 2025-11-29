import { z } from "zod";

// Zod schema for runtime validation
export const listUsersSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1).optional(),
		limit: z.coerce.number().int().positive().max(100).default(20).optional(),
		department: z.string().optional(),
		role: z.string().optional(),
		status: z.enum(["ACTIVE", "INACTIVE", "PASSWORD_EXPIRED"]).optional(),
		search: z.string().optional(),
		sortBy: z.string().default("createdAt").optional(),
		sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
	}),
});

// Input type - inferred from Zod (single source of truth)
export type ListUsersInput = z.infer<typeof listUsersSchema.shape.query>;

// User object in list response
export interface UserListItem {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	department: string;
	roles: Array<{
		id: string;
		name: string;
	}>;
	status: string;
	createdAt: string;
}

// Output type - manually defined for response structure
export interface ListUsersOutput {
	data: UserListItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
