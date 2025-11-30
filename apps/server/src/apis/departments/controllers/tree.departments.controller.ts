import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import { createControllerLogger, logSuccess } from "../../../lib/logger";
import { treeDepartmentsService } from "../services/tree.departments.service";

const logger = createControllerLogger("treeDepartments");

export async function treeDepartmentsController(req: Request, res: Response) {
	const startTime = Date.now();

	logger.info({}, "Get departments tree request received");

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const result = await treeDepartmentsService({
		tenantId: user.tenantId,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{
			treeSize: result.tree.length,
		},
		"Departments tree retrieved successfully",
		duration,
	);

	res.status(200).json(result);
}
