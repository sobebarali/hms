import { z } from "zod";

// Zod schema for runtime validation
export const latestVitalsSchema = z.object({
	params: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
	}),
});

// Input types - inferred from Zod (single source of truth)
export type LatestVitalsParams = z.infer<
	typeof latestVitalsSchema.shape.params
>;

// Individual vital with timestamp
export interface VitalWithTimestamp<T = number> {
	value: T;
	recordedAt: string;
}

export interface TemperatureWithTimestamp {
	value: number;
	unit: string;
	recordedAt: string;
}

export interface BloodPressureWithTimestamp {
	systolic: number;
	diastolic: number;
	recordedAt: string;
}

export interface WeightWithTimestamp {
	value: number;
	unit: string;
	recordedAt: string;
}

export interface HeightWithTimestamp {
	value: number;
	unit: string;
	recordedAt: string;
}

export interface BloodGlucoseWithTimestamp {
	value: number;
	unit: string;
	timing: string;
	recordedAt: string;
}

// Output type - manually defined for response structure
export interface LatestVitalsOutput {
	patientId: string;
	temperature?: TemperatureWithTimestamp;
	bloodPressure?: BloodPressureWithTimestamp;
	heartRate?: VitalWithTimestamp;
	respiratoryRate?: VitalWithTimestamp;
	oxygenSaturation?: VitalWithTimestamp;
	weight?: WeightWithTimestamp;
	height?: HeightWithTimestamp;
	bmi?: VitalWithTimestamp;
	bloodGlucose?: BloodGlucoseWithTimestamp;
	painLevel?: VitalWithTimestamp;
}
