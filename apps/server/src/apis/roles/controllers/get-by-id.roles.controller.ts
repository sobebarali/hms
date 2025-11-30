import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { getRoleByIdService } from "../services/get-by-id.roles.service";

const logger = createControllerLogger("getRoleById");

export async function getRoleByIdController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(logger, req.params, "Get role by ID request received");

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const { id } = req.params as { id: string };

	const result = await getRoleByIdService({
		tenantId: user.tenantId,
		roleId: id,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{ roleId: result.id },
		"Role retrieved successfully",
		duration,
	);

	res.status(200).json(result);
}
