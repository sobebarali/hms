import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { removeStaffService } from "../services/remove-staff.departments.service";
import type { RemoveStaffParams } from "../validations/remove-staff.departments.validation";

const logger = createControllerLogger("removeStaffDepartments");

export async function removeStaffController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(logger, req.params, "Remove staff from department request received");

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const { id, userId } = req.params as unknown as RemoveStaffParams;

	const result = await removeStaffService({
		tenantId: user.tenantId,
		departmentId: id,
		userId,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{
			departmentId: id,
			userId,
		},
		"Staff removed from department successfully",
		duration,
	);

	res.status(200).json(result);
}
