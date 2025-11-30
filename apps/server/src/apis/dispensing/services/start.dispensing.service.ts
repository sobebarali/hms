import { BadRequestError, InternalError, NotFoundError } from "../../../errors";
import { createServiceLogger, logError } from "../../../lib/logger";
import { findStaffById } from "../../users/repositories/shared.users.repository";
import {
	type DispensingLean,
	findDispensingByPrescriptionId,
	findInventoryByMedicineIds,
	findPrescriptionById,
	generateDispensingId,
	updatePrescriptionStatus,
} from "../repositories/shared.dispensing.repository";
import { createDispensing } from "../repositories/start.dispensing.repository";
import type { StartDispensingOutput } from "../validations/start.dispensing.validation";

const logger = createServiceLogger("startDispensing");

/**
 * Start dispensing a prescription
 */
export async function startDispensingService({
	tenantId,
	prescriptionId,
	pharmacistId,
}: {
	tenantId: string;
	prescriptionId: string;
	pharmacistId: string;
}): Promise<StartDispensingOutput> {
	logger.info(
		{ tenantId, prescriptionId, pharmacistId },
		"Starting dispensing",
	);

	// Get prescription
	const prescription = await findPrescriptionById({ tenantId, prescriptionId });
	if (!prescription) {
		throw new NotFoundError("Prescription not found", "PRESCRIPTION_NOT_FOUND");
	}

	// Check prescription status
	if (prescription.status === "CANCELLED") {
		throw new BadRequestError(
			"Prescription has been cancelled",
			"PRESCRIPTION_CANCELLED",
		);
	}

	// Check if already being dispensed
	const existingDispensing = await findDispensingByPrescriptionId({
		tenantId,
		prescriptionId,
	});
	if (existingDispensing) {
		throw new BadRequestError(
			"Dispensing already in progress",
			"ALREADY_STARTED",
		);
	}

	// Get pharmacist info
	const pharmacist = await findStaffById({ tenantId, staffId: pharmacistId });
	if (!pharmacist) {
		throw new NotFoundError("Pharmacist not found", "PHARMACIST_NOT_FOUND");
	}

	// Get inventory for all medicines (if they have medicineId references)
	const medicineIds = prescription.medicines
		.map((m) => m.medicineId)
		.filter((id): id is string => Boolean(id));

	const inventoryList =
		medicineIds.length > 0
			? await findInventoryByMedicineIds({
					tenantId,
					medicineIds,
				})
			: [];

	// Create inventory map
	const inventoryMap = new Map(
		inventoryList.map((inv) => [inv.medicineId, inv]),
	);

	// Generate dispensing ID
	const dispensingId = await generateDispensingId({ tenantId });

	// Create dispensing record and update prescription status
	// Note: These operations are not transactional but are idempotent
	// If the first succeeds and second fails, the next attempt will catch it
	// via the existingDispensing check above
	let dispensing: DispensingLean;

	try {
		// Create dispensing record
		dispensing = await createDispensing({
			dispensingId,
			tenantId,
			prescriptionId,
			assignedTo: pharmacistId,
			prescription,
		});

		// Update prescription status
		await updatePrescriptionStatus({
			tenantId,
			prescriptionId,
			status: "DISPENSING",
		});
	} catch (error) {
		logError(logger, error, "Failed to start dispensing", {
			tenantId,
			prescriptionId,
		});
		throw new InternalError("Failed to start dispensing");
	}

	// Map medicines with stock info
	const medicines = prescription.medicines.map((med) => {
		const inventory = inventoryMap.get(med.medicineId || "");
		return {
			id: String(med._id),
			name: med.name,
			dosage: med.dosage,
			prescribedQuantity: med.quantity || 0,
			availableStock: inventory?.currentStock || 0,
			status: "PENDING",
		};
	});

	logger.info(
		{ tenantId, prescriptionId, dispensingId },
		"Dispensing started successfully",
	);

	return {
		id: String(dispensing._id),
		prescriptionId: String(dispensing.prescriptionId),
		status: dispensing.status,
		assignedTo: {
			id: String(pharmacist._id),
			firstName: pharmacist.firstName,
			lastName: pharmacist.lastName,
		},
		startedAt: dispensing.startedAt?.toISOString() || new Date().toISOString(),
		medicines,
	};
}
