import { z } from "zod";
import { operatingHoursSchema } from "./shared.departments.validation";

// Zod schema for runtime validation
export const updateDepartmentSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid department ID format"),
	}),
	body: z.object({
		name: z.string().min(1).max(100).optional(),
		description: z.string().max(500).optional(),
		headId: z
			.string()
			.uuid("Invalid head user ID format")
			.optional()
			.nullable(),
		parentId: z
			.string()
			.uuid("Invalid parent department ID format")
			.optional()
			.nullable(),
		location: z.string().max(200).optional(),
		contactPhone: z.string().max(20).optional(),
		contactEmail: z.string().email("Invalid email format").optional(),
		operatingHours: operatingHoursSchema,
	}),
});

// Input type - inferred from Zod
export type UpdateDepartmentParams = z.infer<
	typeof updateDepartmentSchema.shape.params
>;
export type UpdateDepartmentBody = z.infer<
	typeof updateDepartmentSchema.shape.body
>;

// Output type for update response
export interface UpdateDepartmentOutput {
	id: string;
	name: string;
	code: string;
	description?: string;
	type: string;
	headId?: string | null;
	parentId?: string | null;
	location?: string;
	contactPhone?: string;
	contactEmail?: string;
	status: string;
	updatedAt: string;
}
