import { Dispensing, MedicineDispensingStatus } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { MedicineDispensingDetail } from "../validations/dispense.dispensing.validation";
import type { DispensingLean } from "./shared.dispensing.repository";

const logger = createRepositoryLogger("dispenseDispensing");

interface UpdateMedicineParams {
	tenantId: string;
	prescriptionId: string;
	medicines: MedicineDispensingDetail[];
}

// Interface for medicine subdocument
interface MedicineSubdoc {
	medicineId: string;
	dispensedQuantity: number;
	batchNumber?: string;
	expiryDate?: Date;
	substituted: boolean;
	substituteNote?: string;
	status: string;
}

/**
 * Update dispensing record with dispensed medicine details
 */
export async function updateDispensedMedicines({
	tenantId,
	prescriptionId,
	medicines,
}: UpdateMedicineParams): Promise<DispensingLean | null> {
	try {
		logger.debug(
			{ tenantId, prescriptionId, medicineCount: medicines.length },
			"Updating dispensed medicines",
		);

		// Get current dispensing record
		const dispensing = await Dispensing.findOne({
			tenantId,
			prescriptionId,
		});

		if (!dispensing) {
			return null;
		}

		// Update each medicine in the dispensing record
		const medicineArray = dispensing.medicines as unknown as MedicineSubdoc[];
		for (const med of medicines) {
			const medicineIndex = medicineArray.findIndex(
				(m) => m.medicineId === med.medicineId,
			);

			if (medicineIndex !== -1) {
				const medicine = medicineArray[medicineIndex];
				if (medicine) {
					medicine.dispensedQuantity = med.dispensedQuantity;
					medicine.status = MedicineDispensingStatus.DISPENSED;

					if (med.batchNumber) {
						medicine.batchNumber = med.batchNumber;
					}
					if (med.expiryDate) {
						medicine.expiryDate = new Date(med.expiryDate);
					}
					if (med.substituted !== undefined) {
						medicine.substituted = med.substituted;
					}
					if (med.substituteNote) {
						medicine.substituteNote = med.substituteNote;
					}
				}
			}
		}

		await dispensing.save();

		logDatabaseOperation(
			logger,
			"update",
			"dispensing",
			{ tenantId, prescriptionId },
			{ updated: true, medicineCount: medicines.length },
		);

		return dispensing.toObject() as unknown as DispensingLean;
	} catch (error) {
		logError(logger, error, "Failed to update dispensed medicines");
		throw error;
	}
}
