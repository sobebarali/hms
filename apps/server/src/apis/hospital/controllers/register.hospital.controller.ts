import type { Request, Response } from "express";
import {
	createControllerLogger,
	logError,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { registerHospital } from "../services/register.hospital.service";

const logger = createControllerLogger("registerHospital");

export async function registerHospitalController(req: Request, res: Response) {
	const startTime = Date.now();

	try {
		// Log controller entry with input payload
		logInput(logger, req.body, "Register hospital controller started");

		const hospital = await registerHospital(req.body);

		const duration = Date.now() - startTime;

		// Log success with generated IDs and duration
		logSuccess(
			logger,
			{
				hospitalId: hospital.id,
				tenantId: hospital.tenantId,
				status: hospital.status,
			},
			"Hospital registered successfully",
			duration,
		);

		res.status(201).json(hospital);
	} catch (error: unknown) {
		const duration = Date.now() - startTime;

		// Handle known business errors
		if (
			error &&
			typeof error === "object" &&
			"status" in error &&
			"code" in error
		) {
			const err = error as { status: number; code: string; message: string };

			// Log business error
			logger.warn(
				{
					errorCode: err.code,
					errorMessage: err.message,
					duration,
				},
				"Business validation failed",
			);

			return res.status(err.status).json({
				code: err.code,
				message: err.message,
			});
		}

		// Handle mongoose duplicate key errors
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === 11000
		) {
			logger.warn(
				{
					errorCode: "DUPLICATE_ERROR",
					duration,
				},
				"Duplicate key error",
			);

			return res.status(409).json({
				code: "DUPLICATE_ERROR",
				message: "A hospital with this information already exists",
			});
		}

		// Log unexpected errors with full context
		logError(logger, error, "Unexpected error registering hospital", {
			input: req.body,
			duration,
		});

		// Return generic error
		res.status(500).json({
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred while registering the hospital",
		});
	}
}
