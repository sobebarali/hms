import { Hospital } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import { findHospitalById as findHospitalByIdShared } from "./shared.hospital.repository";

const logger = createRepositoryLogger("updateStatusHospital");

/**
 * Find hospital by ID (wrapper for backward compatibility with different param name)
 */
export async function findHospitalById({ id }: { id: string }) {
	return findHospitalByIdShared({ hospitalId: id });
}

export async function updateHospitalStatus({
	id,
	status,
}: {
	id: string;
	status: string;
}) {
	try {
		logger.debug({ hospitalId: id, status }, "Updating hospital status");

		const hospital = await Hospital.findByIdAndUpdate(
			id,
			{ $set: { status } },
			{ new: true, runValidators: true },
		);

		logDatabaseOperation(
			logger,
			"findByIdAndUpdate",
			"hospitals",
			{ _id: id },
			hospital
				? { _id: hospital._id, status: hospital.status, updated: true }
				: { updated: false, reason: "not_found" },
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to update hospital status", {
			hospitalId: id,
			status,
		});
		throw error;
	}
}
