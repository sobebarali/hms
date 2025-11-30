import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { updateRoleService } from "../services/update.roles.service";
import type { UpdateRoleInput } from "../validations/update.roles.validation";

const logger = createControllerLogger("updateRole");

export async function updateRoleController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(
		logger,
		{ params: req.params, body: req.body },
		"Update role request received",
	);

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const { id } = req.params as { id: string };
	const data = req.body as UpdateRoleInput;

	const result = await updateRoleService({
		tenantId: user.tenantId,
		roleId: id,
		data,
		userPermissions: user.permissions || [],
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{ roleId: result.id },
		"Role updated successfully",
		duration,
	);

	res.status(200).json(result);
}
