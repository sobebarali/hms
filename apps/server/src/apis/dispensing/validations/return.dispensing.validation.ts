import { z } from "zod";

// Zod schema for runtime validation
export const returnDispensingSchema = z.object({
	params: z.object({
		prescriptionId: z.string().min(1, "Prescription ID is required"),
	}),
	body: z.object({
		reason: z.string().min(1, "Reason is required"),
	}),
});

// Input types - inferred from Zod
export type ReturnDispensingParams = z.infer<
	typeof returnDispensingSchema.shape.params
>;
export type ReturnDispensingBody = z.infer<
	typeof returnDispensingSchema.shape.body
>;

// Output type
export interface ReturnDispensingOutput {
	prescriptionId: string;
	status: string;
	returnedAt: string;
}
