import { z } from "zod";

// Zod schema for runtime validation
export const updateVitalsSchema = z.object({
	params: z.object({
		id: z.string().min(1, "Vitals ID is required"),
	}),
	body: z.object({
		notes: z.string().optional(),
		correctionReason: z.string().min(1, "Correction reason is required"),
	}),
});

// Input types - inferred from Zod (single source of truth)
export type UpdateVitalsParams = z.infer<
	typeof updateVitalsSchema.shape.params
>;
export type UpdateVitalsInput = z.infer<typeof updateVitalsSchema.shape.body>;

// Output type - manually defined for response structure
export interface UpdateVitalsOutput {
	id: string;
	patientId: string;
	notes?: string;
	correctionReason: string;
	updatedAt: string;
}
