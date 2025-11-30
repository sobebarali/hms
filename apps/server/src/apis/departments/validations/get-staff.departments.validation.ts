import { z } from "zod";

// Zod schema for runtime validation
export const getStaffSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid department ID format"),
	}),
	query: z.object({
		page: z.coerce.number().min(1).default(1).optional(),
		limit: z.coerce.number().min(1).max(100).default(20).optional(),
		role: z.string().optional(),
		status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE").optional(),
	}),
});

// Input types
export type GetStaffParams = z.infer<typeof getStaffSchema.shape.params>;
export type GetStaffQuery = z.infer<typeof getStaffSchema.shape.query>;

// Staff member output type
export interface StaffMember {
	id: string;
	name: string;
	email: string;
	role: string;
	specialization?: string;
	status: string;
	assignedAt: string;
}

// Output type for staff list response
export interface GetStaffOutput {
	data: StaffMember[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
