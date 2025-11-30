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
import { dispenseMedicinesService } from "../services/dispense.dispensing.service";

const logger = createControllerLogger("dispenseDispensing");

export const dispenseDispensingController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		// Validate staffId is present (required for dispensing)
		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to dispense medicines",
				"STAFF_ID_REQUIRED",
			);
		}

		logInput(
			logger,
			{
				prescriptionId: req.params.prescriptionId,
				medicineCount: req.body.medicines?.length,
			},
			"Dispense medicines request received",
		);

		const result = await dispenseMedicinesService({
			tenantId: req.user.tenantId,
			prescriptionId: req.params.prescriptionId as string,
			pharmacistId: req.user.staffId,
			medicines: req.body.medicines,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				id: result.id,
				totalDispensed: result.totalDispensed,
				totalPending: result.totalPending,
			},
			"Medicines dispensed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
