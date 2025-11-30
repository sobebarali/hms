import { z } from "zod";

// Zod schema for runtime validation
export const getRoleByIdSchema = z.object({
	params: z.object({
		id: z.string().min(1, "Role ID is required"),
	}),
});

// Input type - inferred from Zod
export type GetRoleByIdInput = z.infer<typeof getRoleByIdSchema.shape.params>;

// Output type for get role response
export interface GetRoleByIdOutput {
	id: string;
	name: string;
	description?: string;
	permissions: string[];
	isSystem: boolean;
	isActive: boolean;
	usersCount: number;
	tenantId: string;
	createdAt: string;
	updatedAt: string;
}
