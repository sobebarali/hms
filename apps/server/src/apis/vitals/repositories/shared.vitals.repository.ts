import { Vitals } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("sharedVitals");

// TypeScript interfaces for lean documents (plain objects returned by .lean())
export interface TemperatureLean {
	value: number;
	unit: string;
}

export interface BloodPressureLean {
	systolic: number;
	diastolic: number;
}

export interface WeightLean {
	value: number;
	unit: string;
}

export interface HeightLean {
	value: number;
	unit: string;
}

export interface BloodGlucoseLean {
	value: number;
	unit: string;
	timing: string;
}

export interface AlertLean {
	type: string;
	parameter: string;
	value: number;
	severity: string;
}

export interface VitalsLean {
	_id: string;
	tenantId: string;
	patientId: string;
	appointmentId?: string;
	admissionId?: string;
	temperature?: TemperatureLean;
	bloodPressure?: BloodPressureLean;
	heartRate?: number;
	respiratoryRate?: number;
	oxygenSaturation?: number;
	weight?: WeightLean;
	height?: HeightLean;
	bmi?: number;
	bloodGlucose?: BloodGlucoseLean;
	painLevel?: number;
	notes?: string;
	correctionReason?: string;
	alerts: AlertLean[];
	recordedBy: string;
	recordedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Find vitals record by ID within a tenant
 */
export async function findVitalsById({
	tenantId,
	vitalsId,
}: {
	tenantId: string;
	vitalsId: string;
}): Promise<VitalsLean | null> {
	try {
		logger.debug({ tenantId, vitalsId }, "Finding vitals by ID");

		const vitals = await Vitals.findOne({
			_id: vitalsId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"vitals",
			{ tenantId, vitalsId },
			vitals ? { _id: vitals._id, found: true } : { found: false },
		);

		return vitals as VitalsLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find vitals by ID");
		throw error;
	}
}
