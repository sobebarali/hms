import { z } from "zod";

// Temperature sub-schema with unit-aware validation
const temperatureSchema = z
	.object({
		value: z.number(),
		unit: z.enum(["CELSIUS", "FAHRENHEIT"]),
	})
	.refine(
		(data) => {
			if (data.unit === "CELSIUS") {
				return data.value >= 25 && data.value <= 45;
			}
			// Fahrenheit: 77°F to 113°F (equivalent to 25°C to 45°C)
			return data.value >= 77 && data.value <= 113;
		},
		{ message: "Temperature value out of valid range for unit" },
	);

// Blood pressure sub-schema
const bloodPressureSchema = z.object({
	systolic: z.number().min(40).max(300),
	diastolic: z.number().min(20).max(200),
});

// Weight sub-schema
const weightSchema = z.object({
	value: z.number().positive(),
	unit: z.enum(["KG", "LB"]),
});

// Height sub-schema
const heightSchema = z.object({
	value: z.number().positive(),
	unit: z.enum(["CM", "IN"]),
});

// Blood glucose sub-schema
const bloodGlucoseSchema = z.object({
	value: z.number().positive(),
	unit: z.enum(["MG_DL", "MMOL_L"]),
	timing: z.enum(["FASTING", "RANDOM", "POSTPRANDIAL"]),
});

// Zod schema for runtime validation
export const recordVitalsSchema = z
	.object({
		body: z.object({
			patientId: z.string().min(1, "Patient ID is required"),
			appointmentId: z.string().optional(),
			admissionId: z.string().optional(),
			temperature: temperatureSchema.optional(),
			bloodPressure: bloodPressureSchema.optional(),
			heartRate: z.number().min(20).max(300).optional(),
			respiratoryRate: z.number().min(4).max(60).optional(),
			oxygenSaturation: z.number().min(50).max(100).optional(),
			weight: weightSchema.optional(),
			height: heightSchema.optional(),
			bloodGlucose: bloodGlucoseSchema.optional(),
			painLevel: z.number().min(0).max(10).optional(),
			notes: z.string().optional(),
		}),
	})
	.refine(
		(data) => {
			// At least one vital measurement is required
			const {
				temperature,
				bloodPressure,
				heartRate,
				respiratoryRate,
				oxygenSaturation,
				weight,
				height,
				bloodGlucose,
				painLevel,
			} = data.body;
			return (
				temperature !== undefined ||
				bloodPressure !== undefined ||
				heartRate !== undefined ||
				respiratoryRate !== undefined ||
				oxygenSaturation !== undefined ||
				weight !== undefined ||
				height !== undefined ||
				bloodGlucose !== undefined ||
				painLevel !== undefined
			);
		},
		{
			message: "At least one vital measurement is required",
			path: ["body"],
		},
	);

// Input type - inferred from Zod (single source of truth)
export type RecordVitalsInput = z.infer<typeof recordVitalsSchema.shape.body>;

// Sub-type exports for reuse
export type TemperatureInput = z.infer<typeof temperatureSchema>;
export type BloodPressureInput = z.infer<typeof bloodPressureSchema>;
export type WeightInput = z.infer<typeof weightSchema>;
export type HeightInput = z.infer<typeof heightSchema>;
export type BloodGlucoseInput = z.infer<typeof bloodGlucoseSchema>;

// Alert output type
export interface AlertOutput {
	type: string;
	parameter: string;
	value: number;
	normalRange: {
		min: number;
		max: number;
	};
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Staff basic info output
export interface StaffBasicInfo {
	id: string;
	firstName: string;
	lastName: string;
}

// Output type - manually defined for response structure
export interface RecordVitalsOutput {
	id: string;
	patientId: string;
	recordedBy: StaffBasicInfo;
	vitals: {
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
		bloodGlucose?: {
			value: number;
			unit: string;
			timing: string;
		};
		painLevel?: number;
	};
	bmi?: number;
	alerts: AlertOutput[];
	notes?: string;
	recordedAt: string;
}
