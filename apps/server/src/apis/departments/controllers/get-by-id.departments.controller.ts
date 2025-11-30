import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { getDepartmentByIdService } from "../services/get-by-id.departments.service";
import type { GetDepartmentByIdInput } from "../validations/get-by-id.departments.validation";

const logger = createControllerLogger("getDepartmentById");

export async function getDepartmentByIdController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(logger, req.params, "Get department by ID request received");

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const { id } = req.params as unknown as GetDepartmentByIdInput;

	const result = await getDepartmentByIdService({
		tenantId: user.tenantId,
		departmentId: id,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{
			departmentId: result.id,
			code: result.code,
		},
		"Department retrieved successfully",
		duration,
	);

	res.status(200).json(result);
}
