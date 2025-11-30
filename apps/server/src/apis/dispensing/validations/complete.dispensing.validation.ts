import { z } from "zod";

// Zod schema for runtime validation
export const completeDispensingSchema = z.object({
	params: z.object({
		prescriptionId: z.string().min(1, "Prescription ID is required"),
	}),
	body: z.object({
		notes: z.string().optional(),
		patientCounseled: z.boolean().optional(),
	}),
});

// Input types - inferred from Zod
export type CompleteDispensingParams = z.infer<
	typeof completeDispensingSchema.shape.params
>;
export type CompleteDispensingBody = z.infer<
	typeof completeDispensingSchema.shape.body
>;

// Output types
export interface CompletedMedicineDetail {
	id: string;
	name: string;
	prescribedQuantity: number;
	dispensedQuantity: number;
	batchNumber?: string;
	expiryDate?: string;
	status: string;
	substituted: boolean;
	substituteNote?: string;
}

export interface CompleteDispensingAssignee {
	id: string;
	firstName: string;
	lastName: string;
}

export interface CompleteDispensingOutput {
	id: string;
	prescriptionId: string;
	status: string;
	completedAt: string;
	completedBy: CompleteDispensingAssignee;
	medicines: CompletedMedicineDetail[];
}
