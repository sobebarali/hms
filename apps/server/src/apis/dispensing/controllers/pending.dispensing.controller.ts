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
import { listPendingPrescriptionsService } from "../services/pending.dispensing.service";
import type { PendingDispensingInput } from "../validations/pending.dispensing.validation";

const logger = createControllerLogger("pendingDispensing");

export const pendingDispensingController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(logger, req.query, "List pending prescriptions request received");

		// req.query is already validated and coerced by the validation middleware
		const validatedQuery = req.query as PendingDispensingInput;

		const result = await listPendingPrescriptionsService({
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
			"Pending prescriptions listed successfully",
			duration,
		);

		res.status(200).json(result);
	},
);
