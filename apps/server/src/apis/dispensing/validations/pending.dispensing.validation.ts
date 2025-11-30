import { z } from "zod";

// Zod schema for runtime validation
export const pendingDispensingSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1).optional(),
		limit: z.coerce.number().int().positive().max(100).default(20).optional(),
		priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]).optional(),
		departmentId: z.string().optional(),
		sortBy: z.string().default("createdAt").optional(),
		sortOrder: z.enum(["asc", "desc"]).default("asc").optional(),
	}),
});

// Input type - inferred from Zod (single source of truth)
export type PendingDispensingInput = z.infer<
	typeof pendingDispensingSchema.shape.query
>;

// Output types
export interface PendingPrescriptionPatient {
	id: string;
	patientId: string;
	firstName: string;
	lastName: string;
}

export interface PendingPrescriptionDoctor {
	id: string;
	firstName: string;
	lastName: string;
}

export interface PendingPrescriptionMedicine {
	id: string;
	name: string;
	dosage: string;
	quantity: number;
}

export interface PendingPrescription {
	id: string;
	prescriptionId: string;
	patient: PendingPrescriptionPatient;
	doctor: PendingPrescriptionDoctor;
	medicines: PendingPrescriptionMedicine[];
	medicineCount: number;
	priority: string;
	createdAt: string;
	waitingTime: number;
}

export interface PendingDispensingSummary {
	totalPending: number;
	urgent: number;
	averageWaitTime: number;
}

export interface PendingDispensingOutput {
	data: PendingPrescription[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
	summary: PendingDispensingSummary;
}
