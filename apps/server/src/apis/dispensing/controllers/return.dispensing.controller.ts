import type { Response } from "express";
import { ForbiddenError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import {
	type AuthenticatedRequest,
	authenticatedHandler,
} from "../../../utils/async-handler";
import { returnToQueueService } from "../services/return.dispensing.service";

const logger = createControllerLogger("returnDispensing");

export const returnDispensingController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		// Validate staffId is present
		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to return prescription",
				"STAFF_ID_REQUIRED",
			);
		}

		logInput(
			logger,
			{
				prescriptionId: req.params.prescriptionId,
				reason: req.body.reason,
			},
			"Return to queue request received",
		);

		const result = await returnToQueueService({
			tenantId: req.user.tenantId,
			prescriptionId: req.params.prescriptionId as string,
			reason: req.body.reason,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				prescriptionId: result.prescriptionId,
				status: result.status,
			},
			"Prescription returned to queue",
			duration,
		);

		res.status(200).json(result);
	},
);
