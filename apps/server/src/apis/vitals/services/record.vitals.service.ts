import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import { createVitals } from "../repositories/record.vitals.repository";
import type { AlertLean } from "../repositories/shared.vitals.repository";
import type {
	AlertOutput,
	RecordVitalsInput,
	RecordVitalsOutput,
} from "../validations/record.vitals.validation";

const logger = createServiceLogger("recordVitals");

// Normal ranges for alert generation
const NORMAL_RANGES = {
	temperature: { min: 35.0, max: 37.5 }, // Celsius
	systolic: { min: 90, max: 140 },
	diastolic: { min: 60, max: 90 },
	heartRate: { min: 60, max: 100 },
	respiratoryRate: { min: 12, max: 20 },
	oxygenSaturation: { min: 95, max: 100 },
	bloodGlucoseFasting: { min: 70, max: 100 }, // mg/dL
	bloodGlucoseRandom: { min: 70, max: 140 }, // mg/dL
	bloodGlucosePostprandial: { min: 70, max: 140 }, // mg/dL
} as const;

/**
 * Convert temperature to Celsius for comparison
 */
function toCelsius(value: number, unit: string): number {
	if (unit === "FAHRENHEIT") {
		return (value - 32) * (5 / 9);
	}
	return value;
}

/**
 * Convert weight to KG for BMI calculation
 */
function toKg(value: number, unit: string): number {
	if (unit === "LB") {
		return value * 0.453592;
	}
	return value;
}

/**
 * Convert height to meters for BMI calculation
 */
function toMeters(value: number, unit: string): number {
	if (unit === "IN") {
		return value * 0.0254;
	}
	return value / 100; // CM to meters
}

/**
 * Convert blood glucose to mg/dL for comparison
 */
function toMgDl(value: number, unit: string): number {
	if (unit === "MMOL_L") {
		return value * 18.0182; // mmol/L to mg/dL conversion
	}
	return value;
}

/**
 * Determine alert severity based on deviation from normal range
 */
function getSeverity(
	value: number,
	min: number,
	max: number,
	criticalThresholds?: { lowCritical?: number; highCritical?: number },
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
	// Check critical thresholds first
	if (
		criticalThresholds?.lowCritical &&
		value < criticalThresholds.lowCritical
	) {
		return "CRITICAL";
	}
	if (
		criticalThresholds?.highCritical &&
		value > criticalThresholds.highCritical
	) {
		return "CRITICAL";
	}

	const range = max - min;
	const deviation = value < min ? min - value : value - max;
	const deviationPercent = (deviation / range) * 100;

	if (deviationPercent > 50) return "HIGH";
	if (deviationPercent > 25) return "MEDIUM";
	return "LOW";
}

/**
 * Generate alerts for abnormal vital values
 */
function generateAlerts(data: RecordVitalsInput): AlertLean[] {
	const alerts: AlertLean[] = [];

	// Temperature alerts
	if (data.temperature) {
		const tempCelsius = toCelsius(
			data.temperature.value,
			data.temperature.unit,
		);
		if (tempCelsius < NORMAL_RANGES.temperature.min) {
			alerts.push({
				type: "HYPOTHERMIA",
				parameter: "temperature",
				value: data.temperature.value,
				severity: getSeverity(
					tempCelsius,
					NORMAL_RANGES.temperature.min,
					NORMAL_RANGES.temperature.max,
					{ lowCritical: 32 },
				),
			});
		} else if (tempCelsius > NORMAL_RANGES.temperature.max) {
			let type = "LOW_GRADE_FEVER";
			if (tempCelsius > 39.5) type = "HIGH_FEVER";
			else if (tempCelsius > 38.5) type = "MODERATE_FEVER";

			alerts.push({
				type,
				parameter: "temperature",
				value: data.temperature.value,
				severity: getSeverity(
					tempCelsius,
					NORMAL_RANGES.temperature.min,
					NORMAL_RANGES.temperature.max,
					{ highCritical: 41 },
				),
			});
		}
	}

	// Blood pressure alerts
	if (data.bloodPressure) {
		const { systolic, diastolic } = data.bloodPressure;

		if (
			systolic < NORMAL_RANGES.systolic.min ||
			diastolic < NORMAL_RANGES.diastolic.min
		) {
			alerts.push({
				type: "HYPOTENSION",
				parameter: "bloodPressure",
				value: systolic,
				severity: getSeverity(
					systolic,
					NORMAL_RANGES.systolic.min,
					NORMAL_RANGES.systolic.max,
					{ lowCritical: 70 },
				),
			});
		} else if (systolic >= 160 || diastolic >= 100) {
			alerts.push({
				type: "HYPERTENSION_STAGE_2",
				parameter: "bloodPressure",
				value: systolic,
				severity: "HIGH",
			});
		} else if (systolic >= 140 || diastolic >= 90) {
			alerts.push({
				type: "HYPERTENSION_STAGE_1",
				parameter: "bloodPressure",
				value: systolic,
				severity: "MEDIUM",
			});
		} else if (systolic > 120 || diastolic > 80) {
			alerts.push({
				type: "ELEVATED_BP",
				parameter: "bloodPressure",
				value: systolic,
				severity: "LOW",
			});
		}
	}

	// Heart rate alerts
	if (data.heartRate !== undefined) {
		if (data.heartRate < NORMAL_RANGES.heartRate.min) {
			alerts.push({
				type: "BRADYCARDIA",
				parameter: "heartRate",
				value: data.heartRate,
				severity: getSeverity(
					data.heartRate,
					NORMAL_RANGES.heartRate.min,
					NORMAL_RANGES.heartRate.max,
					{ lowCritical: 40 },
				),
			});
		} else if (data.heartRate > NORMAL_RANGES.heartRate.max) {
			alerts.push({
				type: "TACHYCARDIA",
				parameter: "heartRate",
				value: data.heartRate,
				severity: getSeverity(
					data.heartRate,
					NORMAL_RANGES.heartRate.min,
					NORMAL_RANGES.heartRate.max,
					{ highCritical: 150 },
				),
			});
		}
	}

	// Respiratory rate alerts
	if (data.respiratoryRate !== undefined) {
		if (
			data.respiratoryRate < NORMAL_RANGES.respiratoryRate.min ||
			data.respiratoryRate > NORMAL_RANGES.respiratoryRate.max
		) {
			alerts.push({
				type:
					data.respiratoryRate < NORMAL_RANGES.respiratoryRate.min
						? "LOW_RESPIRATORY_RATE"
						: "HIGH_RESPIRATORY_RATE",
				parameter: "respiratoryRate",
				value: data.respiratoryRate,
				severity: getSeverity(
					data.respiratoryRate,
					NORMAL_RANGES.respiratoryRate.min,
					NORMAL_RANGES.respiratoryRate.max,
					{ lowCritical: 8, highCritical: 30 },
				),
			});
		}
	}

	// Oxygen saturation alerts
	if (data.oxygenSaturation !== undefined) {
		if (data.oxygenSaturation < 90) {
			alerts.push({
				type: "CRITICAL_HYPOXEMIA",
				parameter: "oxygenSaturation",
				value: data.oxygenSaturation,
				severity: "CRITICAL",
			});
		} else if (data.oxygenSaturation < NORMAL_RANGES.oxygenSaturation.min) {
			alerts.push({
				type: "LOW_OXYGEN_SATURATION",
				parameter: "oxygenSaturation",
				value: data.oxygenSaturation,
				severity: "MEDIUM",
			});
		}
	}

	// Blood glucose alerts
	if (data.bloodGlucose) {
		const { value, unit, timing } = data.bloodGlucose;
		// Convert to mg/dL for comparison (ranges are in mg/dL)
		const valueMgDl = toMgDl(value, unit);
		const ranges =
			timing === "FASTING"
				? NORMAL_RANGES.bloodGlucoseFasting
				: timing === "POSTPRANDIAL"
					? NORMAL_RANGES.bloodGlucosePostprandial
					: NORMAL_RANGES.bloodGlucoseRandom;

		if (valueMgDl < ranges.min) {
			alerts.push({
				type: "HYPOGLYCEMIA",
				parameter: "bloodGlucose",
				value,
				severity: getSeverity(valueMgDl, ranges.min, ranges.max, {
					lowCritical: 54,
				}),
			});
		} else if (valueMgDl > ranges.max) {
			alerts.push({
				type: "HYPERGLYCEMIA",
				parameter: "bloodGlucose",
				value,
				severity: getSeverity(valueMgDl, ranges.min, ranges.max, {
					highCritical: 250,
				}),
			});
		}
	}

	return alerts;
}

/**
 * Calculate BMI from weight and height
 */
function calculateBMI(
	weight: { value: number; unit: string } | undefined,
	height: { value: number; unit: string } | undefined,
): number | undefined {
	if (!weight || !height) return undefined;

	const weightKg = toKg(weight.value, weight.unit);
	const heightM = toMeters(height.value, height.unit);

	if (heightM <= 0) return undefined;

	return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Record new vitals for a patient
 */
export async function recordVitalsService({
	tenantId,
	recordedBy,
	patientId,
	appointmentId,
	admissionId,
	temperature,
	bloodPressure,
	heartRate,
	respiratoryRate,
	oxygenSaturation,
	weight,
	height,
	bloodGlucose,
	painLevel,
	notes,
}: {
	tenantId: string;
	recordedBy: string;
} & RecordVitalsInput): Promise<RecordVitalsOutput> {
	logger.info({ tenantId, patientId, recordedBy }, "Recording vitals");

	// Validate patient exists
	const patient = await findPatientById({ tenantId, patientId });
	if (!patient) {
		logger.warn({ tenantId, patientId }, "Patient not found");
		throw new NotFoundError("Patient not found", "PATIENT_NOT_FOUND");
	}

	// Check patient status is active
	if (patient.status !== "ACTIVE") {
		logger.warn(
			{ tenantId, patientId, status: patient.status },
			"Patient is not active",
		);
		throw new BadRequestError(
			"Cannot record vitals for inactive patient",
			"PATIENT_INACTIVE",
		);
	}

	// Get staff details for response
	const staff = await findStaffById({ tenantId, staffId: recordedBy });
	if (!staff) {
		logger.warn({ tenantId, recordedBy }, "Staff not found");
		throw new NotFoundError("Staff not found", "STAFF_NOT_FOUND");
	}

	// Calculate BMI if height and weight provided
	const bmi = calculateBMI(weight, height);

	// Generate alerts for abnormal values
	const inputData: RecordVitalsInput = {
		patientId,
		appointmentId,
		admissionId,
		temperature,
		bloodPressure,
		heartRate,
		respiratoryRate,
		oxygenSaturation,
		weight,
		height,
		bloodGlucose,
		painLevel,
		notes,
	};
	const alerts = generateAlerts(inputData);

	// Create vitals record
	const vitals = await createVitals({
		tenantId,
		recordedBy,
		patientId,
		appointmentId,
		admissionId,
		temperature,
		bloodPressure,
		heartRate,
		respiratoryRate,
		oxygenSaturation,
		weight,
		height,
		bmi,
		bloodGlucose,
		painLevel,
		notes,
		alerts,
	});

	logger.info(
		{ vitalsId: vitals._id, tenantId, patientId, alertCount: alerts.length },
		"Vitals recorded successfully",
	);

	// Map alerts to output format with normalRange
	const alertOutputs: AlertOutput[] = alerts.map((alert) => {
		let normalRange: { min: number; max: number } = { min: 0, max: 0 };
		switch (alert.parameter) {
			case "temperature":
				normalRange = { ...NORMAL_RANGES.temperature };
				break;
			case "bloodPressure":
				normalRange = { ...NORMAL_RANGES.systolic };
				break;
			case "heartRate":
				normalRange = { ...NORMAL_RANGES.heartRate };
				break;
			case "respiratoryRate":
				normalRange = { ...NORMAL_RANGES.respiratoryRate };
				break;
			case "oxygenSaturation":
				normalRange = { ...NORMAL_RANGES.oxygenSaturation };
				break;
			case "bloodGlucose":
				normalRange = { ...NORMAL_RANGES.bloodGlucoseRandom };
				break;
		}
		return {
			type: alert.type,
			parameter: alert.parameter,
			value: alert.value,
			normalRange,
			severity: alert.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
		};
	});

	// Map to output DTO
	return {
		id: vitals._id,
		patientId: vitals.patientId,
		recordedBy: {
			id: String(staff._id),
			firstName: staff.firstName,
			lastName: staff.lastName,
		},
		vitals: {
			temperature: vitals.temperature,
			bloodPressure: vitals.bloodPressure,
			heartRate: vitals.heartRate,
			respiratoryRate: vitals.respiratoryRate,
			oxygenSaturation: vitals.oxygenSaturation,
			weight: vitals.weight,
			height: vitals.height,
			bloodGlucose: vitals.bloodGlucose,
			painLevel: vitals.painLevel,
		},
		bmi: vitals.bmi,
		alerts: alertOutputs,
		notes: vitals.notes,
		recordedAt: vitals.recordedAt.toISOString(),
	};
}
