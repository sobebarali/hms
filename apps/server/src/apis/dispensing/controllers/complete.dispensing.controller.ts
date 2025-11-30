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
import { completeDispensingService } from "../services/complete.dispensing.service";

const logger = createControllerLogger("completeDispensing");

export const completeDispensingController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		// Validate staffId is present (required for completing dispensing)
		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to complete dispensing",
				"STAFF_ID_REQUIRED",
			);
		}

		logInput(
			logger,
			{ prescriptionId: req.params.prescriptionId },
			"Complete dispensing request received",
		);

		const result = await completeDispensingService({
			tenantId: req.user.tenantId,
			prescriptionId: req.params.prescriptionId as string,
			pharmacistId: req.user.staffId,
			notes: req.body.notes,
			patientCounseled: req.body.patientCounseled,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				id: result.id,
				status: result.status,
			},
			"Dispensing completed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
