import type { Response } from "express";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import {
	type AuthenticatedRequest,
	authenticatedHandler,
} from "../../../utils/async-handler";
import { getDispensingByIdService } from "../services/get-by-id.dispensing.service";

const logger = createControllerLogger("getByIdDispensing");

export const getByIdDispensingController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ prescriptionId: req.params.prescriptionId },
			"Get dispensing by ID request received",
		);

		const result = await getDispensingByIdService({
			tenantId: req.user.tenantId,
			prescriptionId: req.params.prescriptionId as string,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				id: result.id,
				status: result.status,
			},
			"Dispensing retrieved successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
