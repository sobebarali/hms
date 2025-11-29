import { Hospital } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import { findHospitalById as findHospitalByIdShared } from "./shared.hospital.repository";

const logger = createRepositoryLogger("verifyHospital");

/**
 * Find hospital by ID (wrapper for backward compatibility with different param name)
 */
export async function findHospitalById({ id }: { id: string }) {
	return findHospitalByIdShared({ hospitalId: id });
}

export async function updateHospitalVerification({ id }: { id: string }) {
	try {
		logger.debug({ hospitalId: id }, "Updating hospital verification status");

		const hospital = await Hospital.findByIdAndUpdate(
			id,
			{
				status: "VERIFIED",
				$unset: {
					verificationToken: "",
					verificationExpires: "",
				},
			},
			{ new: true },
		);

		logDatabaseOperation(
			logger,
			"update",
			"hospitals",
			{ _id: id },
			hospital
				? { _id: hospital._id, status: hospital.status }
				: { found: false },
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to update hospital verification", {
			hospitalId: id,
		});
		throw error;
	}
}
