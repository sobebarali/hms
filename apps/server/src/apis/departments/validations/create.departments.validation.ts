import { z } from "zod";
import {
	departmentTypeValues,
	operatingHoursSchema,
} from "./shared.departments.validation";

// Zod schema for runtime validation
export const createDepartmentSchema = z.object({
	body: z.object({
		name: z.string().min(1, "Department name is required").max(100),
		code: z
			.string()
			.min(1, "Department code is required")
			.max(20)
			.regex(
				/^[A-Z0-9-]+$/,
				"Code must contain only uppercase letters, numbers, and hyphens",
			),
		description: z.string().max(500).optional(),
		type: z.enum(departmentTypeValues),
		headId: z.string().uuid("Invalid head user ID format").optional(),
		parentId: z.string().uuid("Invalid parent department ID format").optional(),
		location: z.string().max(200).optional(),
		contactPhone: z.string().max(20).optional(),
		contactEmail: z.string().email("Invalid email format").optional(),
		operatingHours: operatingHoursSchema,
	}),
});

// Input type - inferred from Zod (single source of truth)
export type CreateDepartmentInput = z.infer<
	typeof createDepartmentSchema.shape.body
>;

// Output type - manually defined for response structure
export interface CreateDepartmentOutput {
	id: string;
	name: string;
	code: string;
	type: string;
	status: string;
	createdAt: string;
}
