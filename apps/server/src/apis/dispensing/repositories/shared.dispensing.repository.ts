import { Counter, Dispensing, Inventory, Prescription } from "@hms/db";
import type { ClientSession } from "mongoose";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("sharedDispensing");

// TypeScript interfaces for lean documents
export interface DispensingMedicineLean {
	medicineId: string;
	dispensedQuantity: number;
	batchNumber?: string;
	expiryDate?: Date;
	substituted: boolean;
	substituteNote?: string;
	status: string;
	reason?: string;
	alternativeSuggested?: string;
}

export interface DispensingLean {
	_id: string;
	tenantId: string;
	prescriptionId: string;
	status: string;
	assignedTo?: string;
	startedAt?: Date;
	completedAt?: Date;
	collectedAt?: Date;
	medicines: DispensingMedicineLean[];
	notes?: string;
	patientCounseled: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface MedicineItemLean {
	_id: string;
	medicineId?: string;
	name: string;
	genericName?: string;
	dosage: string;
	frequency: string;
	duration: string;
	route?: string;
	quantity?: number;
	instructions?: string;
	dispensed: boolean;
	dispensedQuantity: number;
}

export interface PrescriptionLean {
	_id: string;
	tenantId: string;
	prescriptionId: string;
	patientId: string;
	doctorId: string;
	appointmentId?: string;
	diagnosis: string;
	notes?: string;
	medicines: MedicineItemLean[];
	status: string;
	followUpDate?: Date;
	templateId?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface InventoryBatchLean {
	_id: string;
	batchNumber: string;
	quantity: number;
	expiryDate: Date;
	purchasePrice?: number;
	receivedDate: Date;
	supplier?: string;
}

export interface InventoryLean {
	_id: string;
	tenantId: string;
	medicineId: string;
	currentStock: number;
	reorderLevel: number;
	maxStock?: number;
	location?: string;
	batches: InventoryBatchLean[];
	lastRestocked?: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Find dispensing record by ID
 */
export async function findDispensingById({
	tenantId,
	dispensingId,
}: {
	tenantId: string;
	dispensingId: string;
}): Promise<DispensingLean | null> {
	try {
		logger.debug({ tenantId, dispensingId }, "Finding dispensing by ID");

		const dispensing = await Dispensing.findOne({
			_id: dispensingId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"dispensing",
			{ tenantId, dispensingId },
			dispensing ? { _id: dispensing._id, found: true } : { found: false },
		);

		return dispensing as DispensingLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find dispensing by ID");
		throw error;
	}
}

/**
 * Find dispensing record by prescription ID
 */
export async function findDispensingByPrescriptionId({
	tenantId,
	prescriptionId,
}: {
	tenantId: string;
	prescriptionId: string;
}): Promise<DispensingLean | null> {
	try {
		logger.debug(
			{ tenantId, prescriptionId },
			"Finding dispensing by prescription ID",
		);

		const dispensing = await Dispensing.findOne({
			tenantId,
			prescriptionId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"dispensing",
			{ tenantId, prescriptionId },
			dispensing ? { _id: dispensing._id, found: true } : { found: false },
		);

		return dispensing as DispensingLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find dispensing by prescription ID");
		throw error;
	}
}

/**
 * Find prescription by ID
 */
export async function findPrescriptionById({
	tenantId,
	prescriptionId,
}: {
	tenantId: string;
	prescriptionId: string;
}): Promise<PrescriptionLean | null> {
	try {
		logger.debug({ tenantId, prescriptionId }, "Finding prescription by ID");

		const prescription = await Prescription.findOne({
			_id: prescriptionId,
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"findOne",
			"prescription",
			{ tenantId, prescriptionId },
			prescription ? { _id: prescription._id, found: true } : { found: false },
		);

		return prescription as PrescriptionLean | null;
	} catch (error) {
		logError(logger, error, "Failed to find prescription by ID");
		throw error;
	}
}

/**
 * Find prescriptions by IDs (batch lookup)
 */
export async function findPrescriptionsByIds({
	tenantId,
	prescriptionIds,
}: {
	tenantId: string;
	prescriptionIds: string[];
}): Promise<PrescriptionLean[]> {
	try {
		logger.debug({ tenantId, prescriptionIds }, "Finding prescriptions by IDs");

		const prescriptions = await Prescription.find({
			_id: { $in: prescriptionIds },
			tenantId,
		}).lean();

		logDatabaseOperation(
			logger,
			"find",
			"prescription",
			{ tenantId, count: prescriptionIds.length },
			{ found: prescriptions.length },
		);

		return prescriptions as unknown as PrescriptionLean[];
	} catch (error) {
		logError(logger, error, "Failed to find prescriptions by IDs");
		throw error;
	}
}

/**
 * Find inventory by medicine IDs
 */
export async function findInventoryByMedicineIds({
	tenantId,
	medicineIds,
}: {
	tenantId: string;
	medicineIds: string[];
}): Promise<InventoryLean[]> {
	try {
		logger.debug(
			{ tenantId, medicineIds },
			"Finding inventory by medicine IDs",
		);

		const inventory = await Inventory.find({
			tenantId,
			medicineId: { $in: medicineIds },
		}).lean();

		logDatabaseOperation(
			logger,
			"find",
			"inventory",
			{ tenantId, medicineIds },
			{ found: inventory.length },
		);

		return inventory as unknown as InventoryLean[];
	} catch (error) {
		logError(logger, error, "Failed to find inventory by medicine IDs");
		throw error;
	}
}

/**
 * Generate next dispensing ID for a tenant
 * Format: {tenantId}-DX-{sequential}
 */
export async function generateDispensingId({
	tenantId,
}: {
	tenantId: string;
}): Promise<string> {
	try {
		logger.debug({ tenantId }, "Generating dispensing ID");

		const counter = await Counter.findOneAndUpdate(
			{ tenantId, type: "dispensing" },
			{ $inc: { seq: 1 } },
			{ new: true, upsert: true },
		);

		const seq = counter?.seq || 1;
		const dispensingId = `${tenantId}-DX-${String(seq).padStart(6, "0")}`;

		logDatabaseOperation(
			logger,
			"generateId",
			"counter",
			{ tenantId, type: "dispensing" },
			{ dispensingId, seq },
		);

		return dispensingId;
	} catch (error) {
		logError(logger, error, "Failed to generate dispensing ID");
		throw error;
	}
}

/**
 * Update prescription status
 */
export async function updatePrescriptionStatus({
	tenantId,
	prescriptionId,
	status,
	session,
}: {
	tenantId: string;
	prescriptionId: string;
	status: string;
	session?: ClientSession;
}): Promise<PrescriptionLean | null> {
	try {
		logger.debug(
			{ tenantId, prescriptionId, status },
			"Updating prescription status",
		);

		const prescription = await Prescription.findOneAndUpdate(
			{ _id: prescriptionId, tenantId },
			{ status },
			{ new: true, session },
		).lean();

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"prescription",
			{ tenantId, prescriptionId, status },
			prescription ? { updated: true } : { updated: false },
		);

		return prescription as PrescriptionLean | null;
	} catch (error) {
		logError(logger, error, "Failed to update prescription status");
		throw error;
	}
}
