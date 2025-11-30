import { z } from "zod";

// Zod schema for runtime validation
export const getByIdDispensingSchema = z.object({
	params: z.object({
		prescriptionId: z.string().min(1, "Prescription ID is required"),
	}),
});

// Input type - inferred from Zod
export type GetByIdDispensingInput = z.infer<
	typeof getByIdDispensingSchema.shape.params
>;

// Output types
export interface DispensingMedicineDetail {
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

export interface DispensingPatient {
	id: string;
	patientId: string;
	firstName: string;
	lastName: string;
}

export interface DispensingPrescription {
	id: string;
	prescriptionId: string;
	diagnosis: string;
	notes?: string;
	createdAt: string;
}

export interface DispensingAssignee {
	id: string;
	firstName: string;
	lastName: string;
}

export interface GetByIdDispensingOutput {
	id: string;
	prescription: DispensingPrescription;
	patient: DispensingPatient;
	medicines: DispensingMedicineDetail[];
	status: string;
	assignedTo?: DispensingAssignee;
	startedAt?: string;
	completedAt?: string;
	notes?: string;
}
