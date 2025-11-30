import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { createDepartmentService } from "../services/create.departments.service";
import type { CreateDepartmentInput } from "../validations/create.departments.validation";

const logger = createControllerLogger("createDepartment");

export async function createDepartmentController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(logger, req.body, "Create department request received");

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const data = req.body as CreateDepartmentInput;

	const result = await createDepartmentService({
		tenantId: user.tenantId,
		data,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{
			departmentId: result.id,
			code: result.code,
		},
		"Department created successfully",
		duration,
	);

	res.status(201).json(result);
}
