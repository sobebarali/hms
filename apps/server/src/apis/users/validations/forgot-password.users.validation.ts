import { z } from "zod";

// Zod schema for runtime validation
export const forgotPasswordSchema = z.object({
	body: z.object({
		email: z.string().email(),
		tenant_id: z.string().min(1, "Tenant ID is required"),
	}),
});

// Input type - inferred from Zod (single source of truth)
export type ForgotPasswordInput = z.infer<
	typeof forgotPasswordSchema.shape.body
>;

// Output type - manually defined for response structure
export interface ForgotPasswordOutput {
	message: string;
}
