import { Hospital } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("verifyHospital");

export async function findHospitalById({ id }: { id: string }) {
	try {
		logger.debug({ hospitalId: id }, "Querying hospital by ID");

		const hospital = await Hospital.findById(id);

		logDatabaseOperation(
			logger,
			"findById",
			"hospitals",
			{ _id: id },
			hospital ? { _id: hospital._id, found: true } : { found: false },
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to query hospital by ID", {
			hospitalId: id,
		});
		throw error;
	}
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
