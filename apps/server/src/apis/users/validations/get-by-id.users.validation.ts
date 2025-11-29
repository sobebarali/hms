import { z } from "zod";

// Zod schema for runtime validation
export const getUserByIdSchema = z.object({
	params: z.object({
		id: z.string().min(1, "User ID is required"),
	}),
});

// Input type - inferred from Zod (single source of truth)
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema.shape.params>;

// Output type - manually defined for response structure
export interface GetUserByIdOutput {
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
		permissions: string[];
	}>;
	status: string;
	lastLogin?: string;
	createdAt: string;
	updatedAt: string;
}
