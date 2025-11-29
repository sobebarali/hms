import type { Request, Response } from "express";
import {
	createControllerLogger,
	logError,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { forgotPasswordService } from "../services/forgot-password.users.service";
import type { ForgotPasswordInput } from "../validations/forgot-password.users.validation";

const logger = createControllerLogger("forgotPassword");

export async function forgotPasswordController(req: Request, res: Response) {
	const startTime = Date.now();

	try {
		logInput(
			logger,
			{ email: `****@${req.body.email?.split("@")[1] || "***"}` },
			"Forgot password request received",
		);

		const data = req.body as ForgotPasswordInput;

		const result = await forgotPasswordService({ data });

		const duration = Date.now() - startTime;

		logSuccess(logger, {}, "Forgot password processed", duration);

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
				"Forgot password failed",
			);

			return res.status(err.status).json({
				code: err.code,
				message: err.message,
			});
		}

		// Log unexpected errors
		logError(logger, error, "Unexpected error processing forgot password", {
			duration,
		});

		// Return generic success even on error (security)
		res.status(200).json({
			message:
				"If an account exists with this email, you will receive a password reset link.",
		});
	}
}
