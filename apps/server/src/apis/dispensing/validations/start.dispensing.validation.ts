import { z } from "zod";

// Zod schema for runtime validation
export const startDispensingSchema = z.object({
	params: z.object({
		prescriptionId: z.string().min(1, "Prescription ID is required"),
	}),
});

// Input type - inferred from Zod
export type StartDispensingInput = z.infer<
	typeof startDispensingSchema.shape.params
>;

// Output types
export interface MedicineDispensingItem {
	id: string;
	name: string;
	dosage: string;
	prescribedQuantity: number;
	availableStock: number;
	status: string;
}

export interface StartDispensingAssignee {
	id: string;
	firstName: string;
	lastName: string;
}

export interface StartDispensingOutput {
	id: string;
	prescriptionId: string;
	status: string;
	assignedTo: StartDispensingAssignee;
	startedAt: string;
	medicines: MedicineDispensingItem[];
}
