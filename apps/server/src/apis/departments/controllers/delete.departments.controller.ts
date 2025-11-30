import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { deleteDepartmentService } from "../services/delete.departments.service";
import type { DeleteDepartmentInput } from "../validations/delete.departments.validation";

const logger = createControllerLogger("deleteDepartment");

export async function deleteDepartmentController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(logger, req.params, "Delete department request received");

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const { id } = req.params as unknown as DeleteDepartmentInput;

	const result = await deleteDepartmentService({
		tenantId: user.tenantId,
		departmentId: id,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{
			departmentId: result.id,
			status: result.status,
		},
		"Department deleted successfully",
		duration,
	);

	res.status(200).json(result);
}
