import type { Request, Response } from "express";
import {
	createControllerLogger,
	logError,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { verifyHospital } from "../services/verify.hospital.service";

const logger = createControllerLogger("verifyHospital");

export async function verifyHospitalController(req: Request, res: Response) {
	const startTime = Date.now();

	try {
		// Log controller entry with input payload
		logInput(
			logger,
			{ hospitalId: req.params.id },
			"Verify hospital controller started",
		);

		const result = await verifyHospital({
			id: req.params.id as string,
			token: req.body.token as string,
		});

		const duration = Date.now() - startTime;

		// Log success with generated IDs and duration
		logSuccess(
			logger,
			{
				hospitalId: result.id,
				status: result.status,
			},
			"Hospital verified successfully",
			duration,
		);

		res.status(200).json(result);
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

		// Log unexpected errors with full context
		logError(logger, error, "Unexpected error verifying hospital", {
			hospitalId: req.params.id,
			duration,
		});

		// Return generic error
		res.status(500).json({
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred while verifying the hospital",
		});
	}
}
