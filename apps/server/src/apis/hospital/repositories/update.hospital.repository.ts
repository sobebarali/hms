import { Hospital } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { UpdateHospitalInput } from "../validations/update.hospital.validation";
import { findHospitalById as findHospitalByIdShared } from "./shared.hospital.repository";

const logger = createRepositoryLogger("updateHospital");

/**
 * Find hospital by ID (wrapper for backward compatibility with different param name)
 */
export async function findHospitalById({ id }: { id: string }) {
	return findHospitalByIdShared({ hospitalId: id });
}

export async function updateHospitalById({
	id,
	data,
}: {
	id: string;
	data: UpdateHospitalInput;
}) {
	try {
		logger.debug({ hospitalId: id, data }, "Updating hospital by ID");

		const hospital = await Hospital.findByIdAndUpdate(
			id,
			{ $set: data },
			{ new: true, runValidators: true },
		);

		logDatabaseOperation(
			logger,
			"findByIdAndUpdate",
			"hospitals",
			{ _id: id },
			hospital
				? { _id: hospital._id, updated: true }
				: { updated: false, reason: "not_found" },
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to update hospital by ID", {
			hospitalId: id,
			data,
		});
		throw error;
	}
}
