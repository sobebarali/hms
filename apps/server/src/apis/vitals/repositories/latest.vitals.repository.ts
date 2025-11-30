import { Vitals } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { VitalsLean } from "./shared.vitals.repository";

const logger = createRepositoryLogger("latestVitals");

// Define which vital parameters we need to track individually
const VITAL_PARAMETERS = [
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
] as const;

export type VitalParameter = (typeof VITAL_PARAMETERS)[number];

export interface LatestVitalsMap {
	[key: string]: {
		vitals: VitalsLean;
		recordedAt: Date;
	} | null;
}

/**
 * Get the latest reading for each vital parameter for a patient
 * Uses Promise.all to fetch all parameters in parallel (avoids N+1 sequential queries)
 */
export async function getLatestVitalsByParameter({
	tenantId,
	patientId,
}: {
	tenantId: string;
	patientId: string;
}): Promise<LatestVitalsMap> {
	try {
		logger.debug(
			{ tenantId, patientId },
			"Getting latest vitals by parameter for patient",
		);

		// Fetch all parameters in parallel using Promise.all
		const queries = VITAL_PARAMETERS.map(async (parameter) => {
			const filter: Record<string, unknown> = {
				tenantId,
				patientId,
				[parameter]: { $exists: true, $ne: null },
			};

			const latestVitals = await Vitals.findOne(filter)
				.sort({ recordedAt: -1 })
				.lean();

			return { parameter, latestVitals };
		});

		const queryResults = await Promise.all(queries);

		// Build result map from parallel query results
		const result: LatestVitalsMap = {};
		for (const { parameter, latestVitals } of queryResults) {
			if (latestVitals) {
				result[parameter] = {
					vitals: latestVitals as unknown as VitalsLean,
					recordedAt: new Date(latestVitals.recordedAt),
				};
			} else {
				result[parameter] = null;
			}
		}

		logDatabaseOperation(
			logger,
			"find",
			"vitals",
			{ tenantId, patientId },
			{
				parametersFound: Object.keys(result).filter(
					(key) => result[key] !== null,
				).length,
			},
		);

		return result;
	} catch (error) {
		logError(logger, error, "Failed to get latest vitals by parameter", {
			tenantId,
			patientId,
		});
		throw error;
	}
}
