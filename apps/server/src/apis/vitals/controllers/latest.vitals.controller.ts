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
import { getLatestVitalsService } from "../services/latest.vitals.service";

const logger = createControllerLogger("latestVitals");

export const latestVitalsController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();
		const patientId = req.params.patientId as string;

		logInput(logger, { patientId }, "Get latest vitals request received");

		const result = await getLatestVitalsService({
			tenantId: req.user.tenantId,
			patientId,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ patientId },
			"Latest vitals retrieved successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
