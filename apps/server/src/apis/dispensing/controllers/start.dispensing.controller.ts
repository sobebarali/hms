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
import { startDispensingService } from "../services/start.dispensing.service";

const logger = createControllerLogger("startDispensing");

export const startDispensingController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		// Validate staffId is present (required for dispensing)
		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to start dispensing",
				"STAFF_ID_REQUIRED",
			);
		}

		logInput(
			logger,
			{ prescriptionId: req.params.prescriptionId },
			"Start dispensing request received",
		);

		const result = await startDispensingService({
			tenantId: req.user.tenantId,
			prescriptionId: req.params.prescriptionId as string,
			pharmacistId: req.user.staffId,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				id: result.id,
				prescriptionId: result.prescriptionId,
			},
			"Dispensing started successfully",
			duration,
		);

		res.status(201).json(result);
	},
);
