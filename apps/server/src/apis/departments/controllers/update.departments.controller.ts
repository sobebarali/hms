import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { updateDepartmentService } from "../services/update.departments.service";
import type {
	UpdateDepartmentBody,
	UpdateDepartmentParams,
} from "../validations/update.departments.validation";

const logger = createControllerLogger("updateDepartment");

export async function updateDepartmentController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(
		logger,
		{ params: req.params, body: req.body },
		"Update department request received",
	);

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const { id } = req.params as unknown as UpdateDepartmentParams;
	const data = req.body as UpdateDepartmentBody;

	const result = await updateDepartmentService({
		tenantId: user.tenantId,
		departmentId: id,
		data,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{
			departmentId: result.id,
			code: result.code,
		},
		"Department updated successfully",
		duration,
	);

	res.status(200).json(result);
}
