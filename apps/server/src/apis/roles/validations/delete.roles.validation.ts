import { z } from "zod";

// Zod schema for runtime validation
export const deleteRoleSchema = z.object({
	params: z.object({
		id: z.string().min(1, "Role ID is required"),
	}),
});

// Input type - inferred from Zod
export type DeleteRoleParams = z.infer<typeof deleteRoleSchema.shape.params>;

// Output type for delete role response
export interface DeleteRoleOutput {
	id: string;
	name: string;
	isActive: boolean;
	deactivatedAt: string;
}
