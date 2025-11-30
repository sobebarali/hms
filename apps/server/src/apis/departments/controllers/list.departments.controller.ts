import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { listDepartmentsService } from "../services/list.departments.service";
import type { ListDepartmentsInput } from "../validations/list.departments.validation";

const logger = createControllerLogger("listDepartments");

export async function listDepartmentsController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(logger, req.query, "List departments request received");

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const query = req.query as unknown as ListDepartmentsInput;

	const result = await listDepartmentsService({
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
		"Departments listed successfully",
		duration,
	);

	res.status(200).json(result);
}
