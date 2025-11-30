import { Vitals } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { RecordVitalsInput } from "../validations/record.vitals.validation";
import type { AlertLean, VitalsLean } from "./shared.vitals.repository";

const logger = createRepositoryLogger("recordVitals");

/**
 * Create a new vitals record
 */
export async function createVitals({
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
}: {
	tenantId: string;
	recordedBy: string;
	bmi?: number;
	alerts: AlertLean[];
} & RecordVitalsInput): Promise<VitalsLean> {
	try {
		const id = uuidv4();
		const now = new Date();

		logger.debug({ id, tenantId, patientId }, "Creating vitals record");

		await Vitals.create({
			_id: id,
			tenantId,
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
			recordedBy,
			recordedAt: now,
			createdAt: now,
			updatedAt: now,
		});

		// Re-fetch to trigger decryption hooks (create doesn't decrypt)
		const vitals = await Vitals.findById(id);
		if (!vitals) {
			throw new Error("Failed to retrieve created vitals record");
		}

		logDatabaseOperation(
			logger,
			"create",
			"vitals",
			{ tenantId, patientId },
			{ _id: vitals._id },
		);

		logger.info(
			{ id, tenantId, patientId },
			"Vitals record created successfully",
		);

		return vitals.toObject() as unknown as VitalsLean;
	} catch (error) {
		logError(logger, error, "Failed to create vitals record", { tenantId });
		throw error;
	}
}
