import { z } from "zod";

// Zod schema for runtime validation
export const deactivateUserSchema = z.object({
	params: z.object({
		id: z.string().min(1, "User ID is required"),
	}),
});

// Input type - inferred from Zod (single source of truth)
export type DeactivateUserParams = z.infer<
	typeof deactivateUserSchema.shape.params
>;

// Output type - manually defined for response structure
export interface DeactivateUserOutput {
	id: string;
	status: string;
	deactivatedAt: string;
}
