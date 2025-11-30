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
import { updateVitalsService } from "../services/update.vitals.service";

const logger = createControllerLogger("updateVitals");

export const updateVitalsController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();
		const { id } = req.params;

		logInput(logger, { id, ...req.body }, "Update vitals request received");

		const result = await updateVitalsService({
			tenantId: req.user.tenantId,
			vitalsId: id,
			...req.body,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				vitalsId: result.id,
				patientId: result.patientId,
			},
			"Vitals updated successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
