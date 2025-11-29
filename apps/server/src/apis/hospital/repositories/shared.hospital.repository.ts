import { Hospital } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("sharedHospital");

/**
 * Find hospital by ID
 */
export async function findHospitalById({ hospitalId }: { hospitalId: string }) {
	try {
		logger.debug({ hospitalId }, "Querying hospital by ID");

		const hospital = await Hospital.findById(hospitalId);

		logDatabaseOperation(
			logger,
			"findById",
			"hospitals",
			{ _id: hospitalId },
			hospital ? { _id: hospital._id, found: true } : { found: false },
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to query hospital by ID", {
			hospitalId,
		});
		throw error;
	}
}

/**
 * Find hospital by license number
 */
export async function findHospitalByLicense({
	licenseNumber,
}: {
	licenseNumber: string;
}) {
	try {
		logger.debug({ licenseNumber }, "Querying hospital by license number");

		const hospital = await Hospital.findOne({ licenseNumber });

		logDatabaseOperation(
			logger,
			"findOne",
			"hospitals",
			{ licenseNumber },
			hospital ? { _id: hospital._id, found: true } : { found: false },
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to query hospital by license number", {
			licenseNumber,
		});
		throw error;
	}
}

/**
 * Find hospital by admin email
 */
export async function findHospitalByAdminEmail({
	adminEmail,
}: {
	adminEmail: string;
}) {
	try {
		const maskedEmail = `****@${adminEmail.split("@")[1]}`;
		logger.debug(
			{ adminEmail: maskedEmail },
			"Querying hospital by admin email",
		);

		const hospital = await Hospital.findOne({ adminEmail });

		logDatabaseOperation(
			logger,
			"findOne",
			"hospitals",
			{ adminEmail: maskedEmail },
			hospital ? { _id: hospital._id, found: true } : { found: false },
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to query hospital by admin email", {
			adminEmail: `****@${adminEmail.split("@")[1]}`,
		});
		throw error;
	}
}
