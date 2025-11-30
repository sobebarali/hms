import { z } from "zod";

// Zod schema for runtime validation
export const getDepartmentByIdSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid department ID format"),
	}),
});

// Input type - inferred from Zod
export type GetDepartmentByIdInput = z.infer<
	typeof getDepartmentByIdSchema.shape.params
>;

// Operating hours output type
interface OperatingHoursDay {
	start: string;
	end: string;
}

interface OperatingHours {
	monday?: OperatingHoursDay;
	tuesday?: OperatingHoursDay;
	wednesday?: OperatingHoursDay;
	thursday?: OperatingHoursDay;
	friday?: OperatingHoursDay;
	saturday?: OperatingHoursDay;
	sunday?: OperatingHoursDay;
}

// Output type for department details
export interface GetDepartmentByIdOutput {
	id: string;
	name: string;
	code: string;
	description?: string;
	type: string;
	head?: {
		id: string;
		name: string;
		email: string;
	} | null;
	parent?: {
		id: string;
		name: string;
		code: string;
	} | null;
	children: Array<{
		id: string;
		name: string;
		code: string;
		type: string;
	}>;
	location?: string;
	contactPhone?: string;
	contactEmail?: string;
	operatingHours?: OperatingHours;
	status: string;
	staffCount: number;
	createdAt: string;
	updatedAt: string;
}
