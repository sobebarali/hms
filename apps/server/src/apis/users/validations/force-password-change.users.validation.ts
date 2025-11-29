import { z } from "zod";

// Zod schema for runtime validation
export const forcePasswordChangeSchema = z.object({
	params: z.object({
		id: z.string().min(1, "User ID is required"),
	}),
});

// Input type - inferred from Zod (single source of truth)
export type ForcePasswordChangeParams = z.infer<
	typeof forcePasswordChangeSchema.shape.params
>;

// Output type - manually defined for response structure
export interface ForcePasswordChangeOutput {
	id: string;
	status: string;
	message: string;
}
