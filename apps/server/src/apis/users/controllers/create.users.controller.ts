import type { Request, Response } from "express";
import {
	createControllerLogger,
	logError,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { createUserService } from "../services/create.users.service";
import type { CreateUserInput } from "../validations/create.users.validation";

const logger = createControllerLogger("createUser");

export async function createUserController(req: Request, res: Response) {
	const startTime = Date.now();

	try {
		logInput(
			logger,
			{ ...req.body, password: "[REDACTED]" },
			"Create user request received",
		);

		// User should be set by authenticate middleware
		if (!req.user?.id || !req.user.tenantId) {
			logger.warn("No user or tenant found in request");
			return res.status(401).json({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		const data = req.body as CreateUserInput;

		const result = await createUserService({
			tenantId: req.user.tenantId,
			data,
			userRoles: req.user.roles,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				userId: result.id,
				email: result.email,
			},
			"User created successfully",
			duration,
		);

		res.status(201).json(result);
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
				"Create user failed",
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
			logger.warn({ duration }, "Duplicate email error");

			return res.status(409).json({
				code: "EMAIL_EXISTS",
				message: "Email already in use",
			});
		}

		// Log unexpected errors
		logError(logger, error, "Unexpected error creating user", {
			duration,
		});

		res.status(500).json({
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
	}
}
