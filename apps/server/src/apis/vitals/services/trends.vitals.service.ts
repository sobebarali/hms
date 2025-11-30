import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import type { VitalsLean } from "../repositories/shared.vitals.repository";
import { getVitalsForTrends } from "../repositories/trends.vitals.repository";
import type {
	TrendDataPoint,
	TrendStatistics,
	TrendsVitalsOutput,
	TrendsVitalsQuery,
	VitalParameter,
} from "../validations/trends.vitals.validation";

const logger = createServiceLogger("trendsVitals");

// Unit mappings for each parameter
const PARAMETER_UNITS: Record<string, string | undefined> = {
	temperature: "°C/°F",
	bloodPressure: "mmHg",
	heartRate: "bpm",
	respiratoryRate: "breaths/min",
	oxygenSaturation: "%",
	weight: "kg/lb",
	height: "cm/in",
	bmi: "kg/m²",
	bloodGlucose: "mg/dL",
	painLevel: "0-10",
};

/**
 * Extract numeric value from vitals record based on parameter
 */
function extractValue(
	vitals: VitalsLean,
	parameter: VitalParameter,
): { value: number; secondaryValue?: number } | null {
	switch (parameter) {
		case "temperature":
			return vitals.temperature ? { value: vitals.temperature.value } : null;
		case "bloodPressure":
			return vitals.bloodPressure
				? {
						value: vitals.bloodPressure.systolic,
						secondaryValue: vitals.bloodPressure.diastolic,
					}
				: null;
		case "heartRate":
			return vitals.heartRate !== undefined
				? { value: vitals.heartRate }
				: null;
		case "respiratoryRate":
			return vitals.respiratoryRate !== undefined
				? { value: vitals.respiratoryRate }
				: null;
		case "oxygenSaturation":
			return vitals.oxygenSaturation !== undefined
				? { value: vitals.oxygenSaturation }
				: null;
		case "weight":
			return vitals.weight ? { value: vitals.weight.value } : null;
		case "height":
			return vitals.height ? { value: vitals.height.value } : null;
		case "bmi":
			return vitals.bmi !== undefined ? { value: vitals.bmi } : null;
		case "bloodGlucose":
			return vitals.bloodGlucose ? { value: vitals.bloodGlucose.value } : null;
		case "painLevel":
			return vitals.painLevel !== undefined
				? { value: vitals.painLevel }
				: null;
		default:
			return null;
	}
}

/**
 * Calculate statistics for the trend data
 */
function calculateStatistics(
	dataPoints: TrendDataPoint[],
	hasSecondaryValue: boolean,
): TrendStatistics {
	if (dataPoints.length === 0) {
		return {
			min: 0,
			max: 0,
			avg: 0,
			count: 0,
		};
	}

	const values = dataPoints.map((dp) => dp.value);
	const sum = values.reduce((acc, val) => acc + val, 0);

	const stats: TrendStatistics = {
		min: Math.min(...values),
		max: Math.max(...values),
		avg: Math.round((sum / values.length) * 100) / 100,
		count: values.length,
	};

	// Calculate secondary statistics for blood pressure
	if (hasSecondaryValue) {
		const secondaryValues = dataPoints
			.map((dp) => dp.secondaryValue)
			.filter((v): v is number => v !== undefined);

		if (secondaryValues.length > 0) {
			const secondarySum = secondaryValues.reduce((acc, val) => acc + val, 0);
			stats.minSecondary = Math.min(...secondaryValues);
			stats.maxSecondary = Math.max(...secondaryValues);
			stats.avgSecondary =
				Math.round((secondarySum / secondaryValues.length) * 100) / 100;
		}
	}

	return stats;
}

/**
 * Get vital trends for a patient
 */
export async function getTrendsVitalsService({
	tenantId,
	patientId,
	parameter,
	startDate,
	endDate,
	limit: limitParam,
}: {
	tenantId: string;
	patientId: string;
} & TrendsVitalsQuery): Promise<TrendsVitalsOutput> {
	logger.info({ tenantId, patientId, parameter }, "Getting vitals trends");

	const limit = Number(limitParam) || 30;

	// Validate patient exists
	const patient = await findPatientById({ tenantId, patientId });
	if (!patient) {
		logger.warn({ tenantId, patientId }, "Patient not found");
		throw new NotFoundError("Patient not found", "PATIENT_NOT_FOUND");
	}

	// Validate date range if provided
	if (startDate && endDate) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		if (start > end) {
			throw new BadRequestError(
				"Start date must be before end date",
				"INVALID_DATE_RANGE",
			);
		}
	}

	// Get vitals for trends
	const result = await getVitalsForTrends({
		tenantId,
		patientId,
		parameter,
		startDate,
		endDate,
		limit,
	});

	// Extract data points
	const dataPoints: TrendDataPoint[] = [];
	const hasSecondaryValue = parameter === "bloodPressure";

	for (const vitals of result.vitals) {
		const extracted = extractValue(vitals, parameter);
		if (extracted) {
			const dataPoint: TrendDataPoint = {
				value: extracted.value,
				recordedAt: vitals.recordedAt.toISOString(),
				vitalsId: vitals._id,
			};
			if (hasSecondaryValue && extracted.secondaryValue !== undefined) {
				dataPoint.secondaryValue = extracted.secondaryValue;
			}
			dataPoints.push(dataPoint);
		}
	}

	// Calculate statistics
	const statistics = calculateStatistics(dataPoints, hasSecondaryValue);

	logger.info(
		{
			tenantId,
			patientId,
			parameter,
			dataPointCount: dataPoints.length,
		},
		"Vitals trends retrieved successfully",
	);

	return {
		patientId,
		parameter,
		unit: PARAMETER_UNITS[parameter],
		dataPoints,
		statistics,
		dateRange: {
			start: result.dateRange.start.toISOString(),
			end: result.dateRange.end.toISOString(),
		},
	};
}
