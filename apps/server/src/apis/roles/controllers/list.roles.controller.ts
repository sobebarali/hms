import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { listRolesService } from "../services/list.roles.service";
import type { ListRolesInput } from "../validations/list.roles.validation";

const logger = createControllerLogger("listRoles");

export async function listRolesController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(logger, req.query, "List roles request received");

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const query = req.query as unknown as ListRolesInput;

	const result = await listRolesService({
		tenantId: user.tenantId,
		query,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{
			total: result.pagination.total,
			returned: result.data.length,
		},
		"Roles listed successfully",
		duration,
	);

	res.status(200).json(result);
}
