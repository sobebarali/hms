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
import { markMedicineUnavailableService } from "../services/unavailable.dispensing.service";

const logger = createControllerLogger("unavailableDispensing");

export const unavailableDispensingController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		// Validate staffId is present
		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to mark medicine unavailable",
				"STAFF_ID_REQUIRED",
			);
		}

		logInput(
			logger,
			{
				prescriptionId: req.params.prescriptionId,
				medicineId: req.body.medicineId,
			},
			"Mark medicine unavailable request received",
		);

		const result = await markMedicineUnavailableService({
			tenantId: req.user.tenantId,
			prescriptionId: req.params.prescriptionId as string,
			medicineId: req.body.medicineId,
			reason: req.body.reason,
			alternativeSuggested: req.body.alternativeSuggested,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				medicineId: result.medicineId,
				status: result.status,
			},
			"Medicine marked as unavailable",
			duration,
		);

		res.status(200).json(result);
	},
);
