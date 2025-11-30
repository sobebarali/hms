import { z } from "zod";

// Medicine dispensing detail schema
const medicineDispensingDetailSchema = z.object({
	medicineId: z.string().min(1, "Medicine ID is required"),
	dispensedQuantity: z.number().int().positive("Quantity must be positive"),
	batchNumber: z.string().optional(),
	expiryDate: z.string().optional(),
	substituted: z.boolean().optional(),
	substituteNote: z.string().optional(),
});

// Zod schema for runtime validation
export const dispenseDispensingSchema = z.object({
	params: z.object({
		prescriptionId: z.string().min(1, "Prescription ID is required"),
	}),
	body: z.object({
		medicines: z
			.array(medicineDispensingDetailSchema)
			.min(1, "At least one medicine is required"),
	}),
});

// Input types - inferred from Zod
export type DispenseDispensingParams = z.infer<
	typeof dispenseDispensingSchema.shape.params
>;
export type DispenseDispensingBody = z.infer<
	typeof dispenseDispensingSchema.shape.body
>;
export type MedicineDispensingDetail = z.infer<
	typeof medicineDispensingDetailSchema
>;

// Output types
export interface DispensedMedicineStatus {
	id: string;
	name: string;
	prescribedQuantity: number;
	dispensedQuantity: number;
	status: string;
}

export interface DispenseDispensingOutput {
	id: string;
	prescriptionId: string;
	medicines: DispensedMedicineStatus[];
	totalDispensed: number;
	totalPending: number;
}
