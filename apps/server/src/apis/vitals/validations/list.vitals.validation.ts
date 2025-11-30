import { z } from "zod";

// Zod schema for runtime validation
export const listVitalsSchema = z.object({
	params: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
	}),
	query: z.object({
		page: z.coerce.number().int().positive().default(1).optional(),
		limit: z.coerce.number().int().positive().max(100).default(20).optional(),
		startDate: z.string().optional(),
		endDate: z.string().optional(),
		parameter: z
			.enum([
				"temperature",
				"bloodPressure",
				"heartRate",
				"respiratoryRate",
				"oxygenSaturation",
				"weight",
				"bloodGlucose",
			])
			.optional(),
		admissionId: z.string().optional(),
	}),
});

// Input types - inferred from Zod (single source of truth)
export type ListVitalsParams = z.infer<typeof listVitalsSchema.shape.params>;
export type ListVitalsQuery = z.infer<typeof listVitalsSchema.shape.query>;

// Vitals record output type
export interface VitalsRecordOutput {
	id: string;
	patientId: string;
	temperature?: {
		value: number;
		unit: string;
	};
	bloodPressure?: {
		systolic: number;
		diastolic: number;
	};
	heartRate?: number;
	respiratoryRate?: number;
	oxygenSaturation?: number;
	weight?: {
		value: number;
		unit: string;
	};
	height?: {
		value: number;
		unit: string;
	};
	bmi?: number;
	bloodGlucose?: {
		value: number;
		unit: string;
		timing: string;
	};
	painLevel?: number;
	notes?: string;
	alerts: {
		type: string;
		parameter: string;
		value: number;
		severity: string;
	}[];
	recordedBy: {
		id: string;
		firstName: string;
		lastName: string;
	};
	recordedAt: string;
}

// Latest vitals summary
export interface LatestVitalsSummary {
	temperature?: { value: number; unit: string; recordedAt: string };
	bloodPressure?: { systolic: number; diastolic: number; recordedAt: string };
	heartRate?: { value: number; recordedAt: string };
	respiratoryRate?: { value: number; recordedAt: string };
	oxygenSaturation?: { value: number; recordedAt: string };
	weight?: { value: number; unit: string; recordedAt: string };
	height?: { value: number; unit: string; recordedAt: string };
	bloodGlucose?: {
		value: number;
		unit: string;
		timing: string;
		recordedAt: string;
	};
}

// Output type - manually defined for response structure
export interface ListVitalsOutput {
	data: VitalsRecordOutput[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
	latestVitals: LatestVitalsSummary;
}
