import { z } from "zod";

// Zod schema for runtime validation
export const deleteDepartmentSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid department ID format"),
	}),
});

// Input type - inferred from Zod
export type DeleteDepartmentInput = z.infer<
	typeof deleteDepartmentSchema.shape.params
>;

// Output type for delete response
export interface DeleteDepartmentOutput {
	id: string;
	status: string;
	deactivatedAt: string;
}
