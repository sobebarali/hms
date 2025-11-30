import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { findStaffByIds } from "../../users/repositories/shared.users.repository";
import {
	getLatestVitalsForPatient,
	listVitals,
} from "../repositories/list.vitals.repository";
import type {
	LatestVitalsSummary,
	ListVitalsOutput,
	ListVitalsQuery,
	VitalsRecordOutput,
} from "../validations/list.vitals.validation";

const logger = createServiceLogger("listVitals");

/**
 * List vitals records for a patient
 */
export async function listVitalsService({
	tenantId,
	patientId,
	page: pageParam,
	limit: limitParam,
	startDate,
	endDate,
	parameter,
	admissionId,
}: {
	tenantId: string;
	patientId: string;
} & ListVitalsQuery): Promise<ListVitalsOutput> {
	logger.info(
		{ tenantId, patientId, page: pageParam, limit: limitParam },
		"Listing vitals",
	);

	const page = Number(pageParam) || 1;
	const limit = Number(limitParam) || 20;

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

	// Fetch vitals with pagination
	const result = await listVitals({
		tenantId,
		patientId,
		page,
		limit,
		startDate,
		endDate,
		parameter,
		admissionId,
	});

	// Collect unique staff IDs for batch lookup
	const staffIds = [...new Set(result.vitals.map((v) => v.recordedBy))];

	// Fetch staff details in a single batch query (avoid N+1)
	const staffList = await findStaffByIds({ tenantId, staffIds });
	const staffMap = new Map<
		string,
		{ id: string; firstName: string; lastName: string }
	>();
	for (const staff of staffList) {
		staffMap.set(String(staff._id), {
			id: String(staff._id),
			firstName: staff.firstName,
			lastName: staff.lastName,
		});
	}

	// Get latest vitals for summary
	const latestRecord = await getLatestVitalsForPatient({ tenantId, patientId });

	const latestVitals: LatestVitalsSummary = {};
	if (latestRecord) {
		if (latestRecord.temperature) {
			latestVitals.temperature = {
				...latestRecord.temperature,
				recordedAt: latestRecord.recordedAt.toISOString(),
			};
		}
		if (latestRecord.bloodPressure) {
			latestVitals.bloodPressure = {
				...latestRecord.bloodPressure,
				recordedAt: latestRecord.recordedAt.toISOString(),
			};
		}
		if (latestRecord.heartRate !== undefined) {
			latestVitals.heartRate = {
				value: latestRecord.heartRate,
				recordedAt: latestRecord.recordedAt.toISOString(),
			};
		}
		if (latestRecord.respiratoryRate !== undefined) {
			latestVitals.respiratoryRate = {
				value: latestRecord.respiratoryRate,
				recordedAt: latestRecord.recordedAt.toISOString(),
			};
		}
		if (latestRecord.oxygenSaturation !== undefined) {
			latestVitals.oxygenSaturation = {
				value: latestRecord.oxygenSaturation,
				recordedAt: latestRecord.recordedAt.toISOString(),
			};
		}
		if (latestRecord.weight) {
			latestVitals.weight = {
				...latestRecord.weight,
				recordedAt: latestRecord.recordedAt.toISOString(),
			};
		}
		if (latestRecord.height) {
			latestVitals.height = {
				...latestRecord.height,
				recordedAt: latestRecord.recordedAt.toISOString(),
			};
		}
		if (latestRecord.bloodGlucose) {
			latestVitals.bloodGlucose = {
				...latestRecord.bloodGlucose,
				recordedAt: latestRecord.recordedAt.toISOString(),
			};
		}
	}

	// Map to output DTOs
	const data: VitalsRecordOutput[] = result.vitals.map((vitals) => {
		const staff = staffMap.get(vitals.recordedBy) || {
			id: vitals.recordedBy,
			firstName: "Unknown",
			lastName: "Staff",
		};

		return {
			id: vitals._id,
			patientId: vitals.patientId,
			temperature: vitals.temperature,
			bloodPressure: vitals.bloodPressure,
			heartRate: vitals.heartRate,
			respiratoryRate: vitals.respiratoryRate,
			oxygenSaturation: vitals.oxygenSaturation,
			weight: vitals.weight,
			height: vitals.height,
			bmi: vitals.bmi,
			bloodGlucose: vitals.bloodGlucose,
			painLevel: vitals.painLevel,
			notes: vitals.notes,
			alerts: vitals.alerts.map((alert) => ({
				type: alert.type,
				parameter: alert.parameter,
				value: alert.value,
				severity: alert.severity,
			})),
			recordedBy: staff,
			recordedAt: vitals.recordedAt.toISOString(),
		};
	});

	logger.info(
		{ tenantId, patientId, total: result.total, returned: data.length },
		"Vitals listed successfully",
	);

	return {
		data,
		pagination: {
			page: result.page,
			limit: result.limit,
			total: result.total,
			totalPages: result.totalPages,
		},
		latestVitals,
	};
}
