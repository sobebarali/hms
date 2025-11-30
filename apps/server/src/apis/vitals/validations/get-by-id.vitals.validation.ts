import { z } from "zod";

// Zod schema for runtime validation
export const getVitalsByIdSchema = z.object({
	params: z.object({
		id: z.string().min(1, "Vitals ID is required"),
	}),
});

// Input type - inferred from Zod (single source of truth)
export type GetVitalsByIdParams = z.infer<
	typeof getVitalsByIdSchema.shape.params
>;

// Output type - manually defined for response structure
export interface GetVitalsByIdOutput {
	id: string;
	patient: {
		id: string;
		patientId: string;
		firstName: string;
		lastName: string;
	};
	appointment?: {
		id: string;
	};
	admission?: {
		id: string;
	};
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
