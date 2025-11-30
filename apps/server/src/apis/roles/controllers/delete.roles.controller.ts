import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { deleteRoleService } from "../services/delete.roles.service";

const logger = createControllerLogger("deleteRole");

export async function deleteRoleController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(logger, req.params, "Delete role request received");

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const { id } = req.params as { id: string };

	const result = await deleteRoleService({
		tenantId: user.tenantId,
		roleId: id,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{ roleId: result.id },
		"Role deleted successfully",
		duration,
	);

	res.status(200).json(result);
}
