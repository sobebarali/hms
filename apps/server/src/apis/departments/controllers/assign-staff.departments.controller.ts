import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { assignStaffService } from "../services/assign-staff.departments.service";
import type {
	AssignStaffBody,
	AssignStaffParams,
} from "../validations/assign-staff.departments.validation";

const logger = createControllerLogger("assignStaffDepartments");

export async function assignStaffController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(
		logger,
		{ params: req.params, body: req.body },
		"Assign staff to department request received",
	);

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const { id } = req.params as unknown as AssignStaffParams;
	const data = req.body as AssignStaffBody;

	const result = await assignStaffService({
		tenantId: user.tenantId,
		departmentId: id,
		data,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{
			departmentId: id,
			userId: result.userId,
		},
		"Staff assigned to department successfully",
		duration,
	);

	res.status(201).json(result);
}
