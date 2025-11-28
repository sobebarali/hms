import { Hospital } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";

const logger = createRepositoryLogger("registerHospital");

export async function createHospital({
	id,
	name,
	slug,
	licenseNumber,
	address,
	contactEmail,
	contactPhone,
	adminEmail,
	adminPhone,
	verificationToken,
	verificationExpires,
}: {
	id: string;
	name: string;
	slug: string;
	licenseNumber: string;
	address: {
		street: string;
		city: string;
		state: string;
		postalCode: string;
		country: string;
	};
	contactEmail: string;
	contactPhone: string;
	adminEmail: string;
	adminPhone: string;
	verificationToken: string;
	verificationExpires: Date;
}) {
	try {
		logger.debug(
			{
				hospitalId: id,
				hospitalName: name,
			},
			"Creating hospital in database",
		);

		const hospital = await Hospital.create({
			_id: id,
			name,
			slug,
			licenseNumber,
			address,
			contactEmail,
			contactPhone,
			adminEmail,
			adminPhone,
			verificationToken,
			verificationExpires,
			status: "PENDING",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		logDatabaseOperation(
			logger,
			"create",
			"hospitals",
			{ _id: id },
			{ _id: hospital._id, status: hospital.status },
		);

		logger.info(
			{
				hospitalId: hospital._id,
				status: hospital.status,
			},
			"Hospital created in database",
		);

		return hospital;
	} catch (error) {
		logError(logger, error, "Failed to create hospital in database", {
			hospitalId: id,
			hospitalName: name,
		});
		throw error;
	}
}

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
