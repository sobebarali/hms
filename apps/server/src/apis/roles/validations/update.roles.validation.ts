import { z } from "zod";

// Zod schema for runtime validation
export const updateRoleSchema = z.object({
	params: z.object({
		id: z.string().min(1, "Role ID is required"),
	}),
	body: z.object({
		name: z.string().min(1).max(50).optional(),
		description: z.string().max(255).optional(),
		permissions: z
			.array(z.string().regex(/^[A-Z_]+:[A-Z_]+$/, "Invalid permission format"))
			.min(1, "At least one permission is required")
			.optional(),
	}),
});

// Input type - inferred from Zod
export type UpdateRoleInput = z.infer<typeof updateRoleSchema.shape.body>;
export type UpdateRoleParams = z.infer<typeof updateRoleSchema.shape.params>;

// Output type for update role response
export interface UpdateRoleOutput {
	id: string;
	name: string;
	description?: string;
	permissions: string[];
	isSystem: boolean;
	isActive: boolean;
	tenantId: string;
	createdAt: string;
	updatedAt: string;
}
