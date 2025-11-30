import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { getLatestVitalsByParameter } from "../repositories/latest.vitals.repository";
import type { LatestVitalsOutput } from "../validations/latest.vitals.validation";

const logger = createServiceLogger("latestVitals");

/**
 * Get the latest vital readings for each parameter for a patient
 */
export async function getLatestVitalsService({
	tenantId,
	patientId,
}: {
	tenantId: string;
	patientId: string;
}): Promise<LatestVitalsOutput> {
	logger.info({ tenantId, patientId }, "Getting latest vitals for patient");

	// Validate patient exists
	const patient = await findPatientById({ tenantId, patientId });
	if (!patient) {
		logger.warn({ tenantId, patientId }, "Patient not found");
		throw new NotFoundError("Patient not found", "PATIENT_NOT_FOUND");
	}

	// Get latest vitals by parameter
	const latestVitalsMap = await getLatestVitalsByParameter({
		tenantId,
		patientId,
	});

	// Build output with only the latest reading for each parameter
	const output: LatestVitalsOutput = {
		patientId,
	};

	// Temperature
	const temperatureEntry = latestVitalsMap.temperature;
	if (temperatureEntry) {
		const temperatureData = temperatureEntry.vitals.temperature;
		if (temperatureData) {
			output.temperature = {
				value: temperatureData.value,
				unit: temperatureData.unit,
				recordedAt: temperatureEntry.vitals.recordedAt.toISOString(),
			};
		}
	}

	// Blood Pressure
	const bloodPressureEntry = latestVitalsMap.bloodPressure;
	if (bloodPressureEntry) {
		const bloodPressureData = bloodPressureEntry.vitals.bloodPressure;
		if (bloodPressureData) {
			output.bloodPressure = {
				systolic: bloodPressureData.systolic,
				diastolic: bloodPressureData.diastolic,
				recordedAt: bloodPressureEntry.vitals.recordedAt.toISOString(),
			};
		}
	}

	// Heart Rate
	const heartRateEntry = latestVitalsMap.heartRate;
	if (heartRateEntry) {
		const heartRateData = heartRateEntry.vitals.heartRate;
		if (heartRateData !== undefined) {
			output.heartRate = {
				value: heartRateData,
				recordedAt: heartRateEntry.vitals.recordedAt.toISOString(),
			};
		}
	}

	// Respiratory Rate
	const respiratoryRateEntry = latestVitalsMap.respiratoryRate;
	if (respiratoryRateEntry) {
		const respiratoryRateData = respiratoryRateEntry.vitals.respiratoryRate;
		if (respiratoryRateData !== undefined) {
			output.respiratoryRate = {
				value: respiratoryRateData,
				recordedAt: respiratoryRateEntry.vitals.recordedAt.toISOString(),
			};
		}
	}

	// Oxygen Saturation
	const oxygenSaturationEntry = latestVitalsMap.oxygenSaturation;
	if (oxygenSaturationEntry) {
		const oxygenSaturationData = oxygenSaturationEntry.vitals.oxygenSaturation;
		if (oxygenSaturationData !== undefined) {
			output.oxygenSaturation = {
				value: oxygenSaturationData,
				recordedAt: oxygenSaturationEntry.vitals.recordedAt.toISOString(),
			};
		}
	}

	// Weight
	const weightEntry = latestVitalsMap.weight;
	if (weightEntry) {
		const weightData = weightEntry.vitals.weight;
		if (weightData) {
			output.weight = {
				value: weightData.value,
				unit: weightData.unit,
				recordedAt: weightEntry.vitals.recordedAt.toISOString(),
			};
		}
	}

	// Height
	const heightEntry = latestVitalsMap.height;
	if (heightEntry) {
		const heightData = heightEntry.vitals.height;
		if (heightData) {
			output.height = {
				value: heightData.value,
				unit: heightData.unit,
				recordedAt: heightEntry.vitals.recordedAt.toISOString(),
			};
		}
	}

	// BMI
	const bmiEntry = latestVitalsMap.bmi;
	if (bmiEntry) {
		const bmiData = bmiEntry.vitals.bmi;
		if (bmiData !== undefined) {
			output.bmi = {
				value: bmiData,
				recordedAt: bmiEntry.vitals.recordedAt.toISOString(),
			};
		}
	}

	// Blood Glucose
	const bloodGlucoseEntry = latestVitalsMap.bloodGlucose;
	if (bloodGlucoseEntry) {
		const bloodGlucoseData = bloodGlucoseEntry.vitals.bloodGlucose;
		if (bloodGlucoseData) {
			output.bloodGlucose = {
				value: bloodGlucoseData.value,
				unit: bloodGlucoseData.unit,
				timing: bloodGlucoseData.timing,
				recordedAt: bloodGlucoseEntry.vitals.recordedAt.toISOString(),
			};
		}
	}

	// Pain Level
	const painLevelEntry = latestVitalsMap.painLevel;
	if (painLevelEntry) {
		const painLevelData = painLevelEntry.vitals.painLevel;
		if (painLevelData !== undefined) {
			output.painLevel = {
				value: painLevelData,
				recordedAt: painLevelEntry.vitals.recordedAt.toISOString(),
			};
		}
	}

	logger.info({ tenantId, patientId }, "Latest vitals retrieved successfully");

	return output;
}
