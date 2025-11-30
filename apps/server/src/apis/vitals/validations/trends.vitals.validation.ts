import { z } from "zod";

// Valid vital parameters for trending
const vitalParameterEnum = z.enum([
	"temperature",
	"bloodPressure",
	"heartRate",
	"respiratoryRate",
	"oxygenSaturation",
	"weight",
	"height",
	"bmi",
	"bloodGlucose",
	"painLevel",
]);

// Zod schema for runtime validation
export const trendsVitalsSchema = z.object({
	params: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
	}),
	query: z.object({
		parameter: vitalParameterEnum,
		startDate: z.string().optional(),
		endDate: z.string().optional(),
		limit: z.string().optional().default("30"),
	}),
});

// Input types - inferred from Zod (single source of truth)
export type TrendsVitalsParams = z.infer<
	typeof trendsVitalsSchema.shape.params
>;
export type TrendsVitalsQuery = z.infer<typeof trendsVitalsSchema.shape.query>;
export type VitalParameter = z.infer<typeof vitalParameterEnum>;

// Data point for trend
export interface TrendDataPoint {
	value: number;
	secondaryValue?: number; // For blood pressure diastolic
	recordedAt: string;
	vitalsId: string;
}

// Statistics for the trend
export interface TrendStatistics {
	min: number;
	max: number;
	avg: number;
	count: number;
	minSecondary?: number; // For blood pressure diastolic
	maxSecondary?: number;
	avgSecondary?: number;
}

// Output type - manually defined for response structure
export interface TrendsVitalsOutput {
	patientId: string;
	parameter: string;
	unit?: string;
	dataPoints: TrendDataPoint[];
	statistics: TrendStatistics;
	dateRange: {
		start: string;
		end: string;
	};
}
