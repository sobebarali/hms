import { NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import {
	findDispensingByPrescriptionId,
	findPrescriptionById,
} from "../repositories/shared.dispensing.repository";
import type { GetByIdDispensingOutput } from "../validations/get-by-id.dispensing.validation";

const logger = createServiceLogger("getByIdDispensing");

/**
 * Get dispensing record by prescription ID
 */
export async function getDispensingByIdService({
	tenantId,
	prescriptionId,
}: {
	tenantId: string;
	prescriptionId: string;
}): Promise<GetByIdDispensingOutput> {
	logger.info({ tenantId, prescriptionId }, "Getting dispensing record");

	// Get dispensing record
	const dispensing = await findDispensingByPrescriptionId({
		tenantId,
		prescriptionId,
	});
	if (!dispensing) {
		throw new NotFoundError(
			"Dispensing record not found",
			"DISPENSING_NOT_FOUND",
		);
	}

	// Get prescription details
	const prescription = await findPrescriptionById({ tenantId, prescriptionId });
	if (!prescription) {
		throw new NotFoundError("Prescription not found", "PRESCRIPTION_NOT_FOUND");
	}

	// Get patient details
	const patient = await findPatientById({
		tenantId,
		patientId: prescription.patientId,
	});

	// Get pharmacist details
	let pharmacist = null;
	if (dispensing.assignedTo) {
		pharmacist = await findStaffById({
			tenantId,
			staffId: dispensing.assignedTo,
		});
	}

	// Create prescription medicine map
	const prescriptionMedicineMap = new Map(
		prescription.medicines.map((m) => [String(m._id), m]),
	);

	// Map medicines
	const medicines = dispensing.medicines.map((med) => {
		const prescriptionMed = prescriptionMedicineMap.get(med.medicineId);
		return {
			id: med.medicineId,
			name: prescriptionMed?.name || "",
			prescribedQuantity: prescriptionMed?.quantity || 0,
			dispensedQuantity: med.dispensedQuantity,
			batchNumber: med.batchNumber,
			expiryDate: med.expiryDate?.toISOString(),
			status: med.status,
			substituted: med.substituted,
			substituteNote: med.substituteNote,
		};
	});

	logger.info({ tenantId, prescriptionId }, "Dispensing record retrieved");

	return {
		id: String(dispensing._id),
		prescription: {
			id: String(prescription._id),
			prescriptionId: prescription.prescriptionId,
			diagnosis: prescription.diagnosis,
			notes: prescription.notes,
			createdAt:
				prescription.createdAt?.toISOString() || new Date().toISOString(),
		},
		patient: {
			id: patient ? String(patient._id) : prescription.patientId,
			patientId: patient?.patientId || "",
			firstName: patient?.firstName || "",
			lastName: patient?.lastName || "",
		},
		medicines,
		status: dispensing.status,
		assignedTo: pharmacist
			? {
					id: String(pharmacist._id),
					firstName: pharmacist.firstName,
					lastName: pharmacist.lastName,
				}
			: undefined,
		startedAt: dispensing.startedAt?.toISOString(),
		completedAt: dispensing.completedAt?.toISOString(),
		notes: dispensing.notes,
	};
}
