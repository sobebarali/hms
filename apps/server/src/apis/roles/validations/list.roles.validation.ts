import { z } from "zod";

// Zod schema for runtime validation
export const listRolesSchema = z.object({
	query: z.object({
		page: z.coerce.number().min(1).default(1).optional(),
		limit: z.coerce.number().min(1).max(100).default(20).optional(),
		search: z.string().max(100).optional(),
		isSystem: z
			.enum(["true", "false"])
			.transform((val) => val === "true")
			.optional(),
		isActive: z
			.enum(["true", "false"])
			.transform((val) => val === "true")
			.optional(),
		sortBy: z.enum(["name", "createdAt"]).default("createdAt").optional(),
		sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
	}),
});

// Input type - inferred from Zod
export type ListRolesInput = z.infer<typeof listRolesSchema.shape.query>;

// Role list item output
export interface RoleListItem {
	id: string;
	name: string;
	description?: string;
	permissions: string[];
	isSystem: boolean;
	isActive: boolean;
	usersCount?: number;
	createdAt: string;
}

// Output type for list response
export interface ListRolesOutput {
	data: RoleListItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
