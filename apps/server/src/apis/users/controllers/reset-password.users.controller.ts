import type { Request, Response } from "express";
import {
	createControllerLogger,
	logError,
	logSuccess,
} from "../../../lib/logger";
import { resetPasswordService } from "../services/reset-password.users.service";
import type { ResetPasswordInput } from "../validations/reset-password.users.validation";

const logger = createControllerLogger("resetPassword");

export async function resetPasswordController(req: Request, res: Response) {
	const startTime = Date.now();

	try {
		logger.info("Reset password request received");

		const data = req.body as ResetPasswordInput;

		const result = await resetPasswordService({ data });

		const duration = Date.now() - startTime;

		logSuccess(logger, {}, "Password reset successfully", duration);

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

			logger.warn(
				{
					errorCode: err.code,
					errorMessage: err.message,
					duration,
				},
				"Reset password failed",
			);

			return res.status(err.status).json({
				code: err.code,
				message: err.message,
			});
		}

		// Log unexpected errors
		logError(logger, error, "Unexpected error resetting password", {
			duration,
		});

		res.status(500).json({
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
	}
}
