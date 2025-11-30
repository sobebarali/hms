import { z } from "zod";

// Zod schema for runtime validation
export const historyDispensingSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1).optional(),
		limit: z.coerce.number().int().positive().max(100).default(20).optional(),
		pharmacistId: z.string().optional(),
		patientId: z.string().optional(),
		startDate: z.string().optional(),
		endDate: z.string().optional(),
		status: z
			.enum(["PENDING", "DISPENSING", "DISPENSED", "COLLECTED", "CANCELLED"])
			.optional(),
	}),
});

// Input type - inferred from Zod
export type HistoryDispensingInput = z.infer<
	typeof historyDispensingSchema.shape.query
>;

// Output types
export interface HistoryDispensingPatient {
	id: string;
	patientId: string;
	firstName: string;
	lastName: string;
}

export interface HistoryDispensingPharmacist {
	id: string;
	firstName: string;
	lastName: string;
}

export interface HistoryDispensingRecord {
	id: string;
	prescriptionId: string;
	patient: HistoryDispensingPatient;
	pharmacist?: HistoryDispensingPharmacist;
	medicineCount: number;
	status: string;
	startedAt?: string;
	completedAt?: string;
	createdAt: string;
}

export interface HistoryDispensingOutput {
	data: HistoryDispensingRecord[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
