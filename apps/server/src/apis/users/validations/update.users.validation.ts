import { z } from "zod";

// Zod schema for runtime validation
export const updateUserSchema = z.object({
	params: z.object({
		id: z.string().min(1, "User ID is required"),
	}),
	body: z.object({
		firstName: z.string().min(1).max(50).optional(),
		lastName: z.string().min(1).max(50).optional(),
		phone: z.string().min(1).optional(),
		department: z.string().min(1).optional(),
		roles: z.array(z.string().min(1)).min(1).optional(),
		specialization: z.string().optional(),
		shift: z.enum(["MORNING", "EVENING", "NIGHT"]).optional(),
	}),
});

// Input type - inferred from Zod (single source of truth)
export type UpdateUserInput = z.infer<typeof updateUserSchema.shape.body>;
export type UpdateUserParams = z.infer<typeof updateUserSchema.shape.params>;

// Output type - manually defined for response structure
export interface UpdateUserOutput {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	phone: string;
	department: string;
	specialization?: string;
	shift?: string;
	roles: Array<{
		id: string;
		name: string;
	}>;
	status: string;
	updatedAt: string;
}
