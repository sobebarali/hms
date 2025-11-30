import { z } from "zod";

// Zod schema for runtime validation
export const unavailableDispensingSchema = z.object({
	params: z.object({
		prescriptionId: z.string().min(1, "Prescription ID is required"),
	}),
	body: z.object({
		medicineId: z.string().min(1, "Medicine ID is required"),
		reason: z.string().min(1, "Reason is required"),
		alternativeSuggested: z.string().optional(),
	}),
});

// Input types - inferred from Zod
export type UnavailableDispensingParams = z.infer<
	typeof unavailableDispensingSchema.shape.params
>;
export type UnavailableDispensingBody = z.infer<
	typeof unavailableDispensingSchema.shape.body
>;

// Output type
export interface UnavailableDispensingOutput {
	medicineId: string;
	status: string;
	reason: string;
	alternativeSuggested?: string;
}
