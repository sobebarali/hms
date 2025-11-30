import { z } from "zod";

// Zod schema for runtime validation
export const removeStaffSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid department ID format"),
		userId: z.string().uuid("Invalid user ID format"),
	}),
});

// Input types
export type RemoveStaffParams = z.infer<typeof removeStaffSchema.shape.params>;

// Output type for removal response
export interface RemoveStaffOutput {
	message: string;
}
