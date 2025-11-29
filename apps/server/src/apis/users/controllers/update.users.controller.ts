import type { Request, Response } from "express";
import {
	createControllerLogger,
	logError,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { updateUserService } from "../services/update.users.service";
import type { UpdateUserInput } from "../validations/update.users.validation";

const logger = createControllerLogger("updateUser");

export async function updateUserController(req: Request, res: Response) {
	const startTime = Date.now();

	try {
		logInput(logger, req.body, "Update user request received");

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

		const data = req.body as UpdateUserInput;

		const result = await updateUserService({
			tenantId: req.user.tenantId,
			userId: id,
			data,
			requesterId: req.user.id,
			requesterRoles: req.user.roles,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				userId: result.id,
			},
			"User updated successfully",
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
				"Update user failed",
			);

			return res.status(err.status).json({
				code: err.code,
				message: err.message,
			});
		}

		// Log unexpected errors
		logError(logger, error, "Unexpected error updating user", {
			duration,
		});

		res.status(500).json({
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
	}
}
