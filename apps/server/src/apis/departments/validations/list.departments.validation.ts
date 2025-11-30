import { z } from "zod";
import {
	departmentStatusValues,
	departmentTypeValues,
} from "./shared.departments.validation";

// Zod schema for runtime validation
export const listDepartmentsSchema = z.object({
	query: z.object({
		page: z.coerce.number().min(1).default(1).optional(),
		limit: z.coerce.number().min(1).max(100).default(50).optional(),
		type: z.enum(departmentTypeValues).optional(),
		status: z.enum(departmentStatusValues).optional(),
		parentId: z.string().uuid().optional(),
		search: z.string().max(100).optional(),
		includeStaffCount: z
			.enum(["true", "false"])
			.transform((val) => val === "true")
			.optional(),
	}),
});

// Input type - inferred from Zod
export type ListDepartmentsInput = z.infer<
	typeof listDepartmentsSchema.shape.query
>;

// Department list item output
export interface DepartmentListItem {
	id: string;
	name: string;
	code: string;
	type: string;
	head?: {
		id: string;
		name: string;
	} | null;
	location?: string;
	status: string;
	staffCount?: number;
}

// Output type for list response
export interface ListDepartmentsOutput {
	data: DepartmentListItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
