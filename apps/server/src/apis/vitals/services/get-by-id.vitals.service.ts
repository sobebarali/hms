import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import { findVitalsById } from "../repositories/shared.vitals.repository";
import type { GetVitalsByIdOutput } from "../validations/get-by-id.vitals.validation";

const logger = createServiceLogger("getVitalsById");

/**
 * Get vitals record by ID
 */
export async function getVitalsByIdService({
	tenantId,
	vitalsId,
}: {
	tenantId: string;
	vitalsId: string;
}): Promise<GetVitalsByIdOutput> {
	logger.info({ tenantId, vitalsId }, "Getting vitals by ID");

	// Find vitals record
	const vitals = await findVitalsById({ tenantId, vitalsId });
	if (!vitals) {
		logger.warn({ tenantId, vitalsId }, "Vitals not found");
		throw new NotFoundError("Vitals record not found", "NOT_FOUND");
	}

	// Get patient details
	const patient = await findPatientById({
		tenantId,
		patientId: vitals.patientId,
	});
	if (!patient) {
		logger.warn({ tenantId, patientId: vitals.patientId }, "Patient not found");
		throw new NotFoundError("Patient not found", "PATIENT_NOT_FOUND");
	}

	// Get staff details
	const staff = await findStaffById({ tenantId, staffId: vitals.recordedBy });

	logger.info({ tenantId, vitalsId }, "Vitals retrieved successfully");

	return {
		id: vitals._id,
		patient: {
			id: String(patient._id),
			patientId: patient.patientId,
			firstName: patient.firstName,
			lastName: patient.lastName,
		},
		appointment: vitals.appointmentId
			? { id: vitals.appointmentId }
			: undefined,
		admission: vitals.admissionId ? { id: vitals.admissionId } : undefined,
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
		recordedBy: staff
			? {
					id: String(staff._id),
					firstName: staff.firstName,
					lastName: staff.lastName,
				}
			: {
					id: vitals.recordedBy,
					firstName: "Unknown",
					lastName: "Staff",
				},
		recordedAt: vitals.recordedAt.toISOString(),
	};
}
