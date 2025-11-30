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
import { listDispensingHistoryService } from "../services/history.dispensing.service";
import type { HistoryDispensingInput } from "../validations/history.dispensing.validation";

const logger = createControllerLogger("historyDispensing");

export const historyDispensingController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(logger, req.query, "Dispensing history request received");

		// req.query is already validated and coerced by the validation middleware
		const validatedQuery = req.query as HistoryDispensingInput;

		const result = await listDispensingHistoryService({
			tenantId: req.user.tenantId,
			...validatedQuery,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				count: result.data.length,
				total: result.pagination.total,
			},
			"Dispensing history listed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
