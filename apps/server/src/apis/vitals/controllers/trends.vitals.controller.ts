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
import { getTrendsVitalsService } from "../services/trends.vitals.service";
import type { TrendsVitalsQuery } from "../validations/trends.vitals.validation";

const logger = createControllerLogger("trendsVitals");

export const trendsVitalsController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();
		const patientId = req.params.patientId as string;
		const query = req.query as unknown as TrendsVitalsQuery;

		logInput(
			logger,
			{ patientId, ...query },
			"Get vitals trends request received",
		);

		const result = await getTrendsVitalsService({
			tenantId: req.user.tenantId,
			patientId,
			...query,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				patientId,
				parameter: query.parameter,
				dataPointCount: result.dataPoints.length,
			},
			"Vitals trends retrieved successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
