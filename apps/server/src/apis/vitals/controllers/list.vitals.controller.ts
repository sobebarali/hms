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
import { listVitalsService } from "../services/list.vitals.service";

const logger = createControllerLogger("listVitals");

export const listVitalsController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(
			logger,
			{ params: req.params, query: req.query },
			"List vitals request received",
		);

		const result = await listVitalsService({
			tenantId: req.user.tenantId,
			patientId: req.params.patientId as string,
			...req.query,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				patientId: req.params.patientId,
				total: result.pagination.total,
				returned: result.data.length,
			},
			"Vitals listed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
