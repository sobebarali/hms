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
import { recordVitalsService } from "../services/record.vitals.service";

const logger = createControllerLogger("recordVitals");

export const recordVitalsController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		// Validate staffId is present (required for vitals recording)
		if (!req.user.staffId) {
			throw new ForbiddenError(
				"Staff ID required to record vitals",
				"STAFF_ID_REQUIRED",
			);
		}

		logInput(logger, req.body, "Record vitals request received");

		const result = await recordVitalsService({
			tenantId: req.user.tenantId,
			recordedBy: req.user.staffId,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				vitalsId: result.id,
				patientId: result.patientId,
				alertCount: result.alerts.length,
			},
			"Vitals recorded successfully",
			duration,
		);

		res.status(201).json(result);
	},
);
