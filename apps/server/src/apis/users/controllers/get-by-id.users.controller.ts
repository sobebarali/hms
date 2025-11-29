import type { Request, Response } from "express";
import {
	createControllerLogger,
	logError,
	logSuccess,
} from "../../../lib/logger";
import { getUserByIdService } from "../services/get-by-id.users.service";

const logger = createControllerLogger("getUserById");

export async function getUserByIdController(req: Request, res: Response) {
	const startTime = Date.now();

	try {
		// User should be set by authenticate middleware
		if (!req.user?.id || !req.user.tenantId) {
			logger.warn("No user or tenant found in request");
			return res.status(401).json({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		const id = req.params.id;

		if (!id) {
			return res.status(400).json({
				code: "INVALID_REQUEST",
				message: "User ID is required",
			});
		}

		const result = await getUserByIdService({
			tenantId: req.user.tenantId,
			userId: id,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				userId: result.id,
			},
			"User retrieved successfully",
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

			logger.warn(
				{
					errorCode: err.code,
					errorMessage: err.message,
					duration,
				},
				"Get user failed",
			);

			return res.status(err.status).json({
				code: err.code,
				message: err.message,
			});
		}

		// Log unexpected errors
		logError(logger, error, "Unexpected error getting user", {
			duration,
		});

		res.status(500).json({
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
	}
}
