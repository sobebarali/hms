import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import { getStaffService } from "../services/get-staff.departments.service";
import type {
	GetStaffParams,
	GetStaffQuery,
} from "../validations/get-staff.departments.validation";

const logger = createControllerLogger("getStaffDepartments");

export async function getStaffController(req: Request, res: Response) {
	const startTime = Date.now();

	logInput(
		logger,
		{ params: req.params, query: req.query },
		"Get department staff request received",
	);

	const { user } = req;
	if (!user?.tenantId) {
		throw new UnauthorizedError("Authentication required");
	}

	const { id } = req.params as unknown as GetStaffParams;
	const query = req.query as unknown as GetStaffQuery;

	const result = await getStaffService({
		tenantId: user.tenantId,
		departmentId: id,
		query,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{
			departmentId: id,
			total: result.pagination.total,
			returned: result.data.length,
		},
		"Department staff retrieved successfully",
		duration,
	);

	res.status(200).json(result);
}
