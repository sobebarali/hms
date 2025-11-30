import { z } from "zod";

// Zod schema for runtime validation
export const assignStaffSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid department ID format"),
	}),
	body: z.object({
		userId: z.string().uuid("Invalid user ID format"),
	}),
});

// Input types
export type AssignStaffParams = z.infer<typeof assignStaffSchema.shape.params>;
export type AssignStaffBody = z.infer<typeof assignStaffSchema.shape.body>;

// Output type for assignment response
export interface AssignStaffOutput {
	userId: string;
	departmentId: string;
	assignedAt: string;
}
