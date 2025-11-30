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
import { getVitalsByIdService } from "../services/get-by-id.vitals.service";

const logger = createControllerLogger("getVitalsById");

export const getVitalsByIdController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ id: req.params.id },
			"Get vitals by ID request received",
		);

		const result = await getVitalsByIdService({
			tenantId: req.user.tenantId,
			vitalsId: req.params.id as string,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{ vitalsId: result.id },
			"Vitals retrieved successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
