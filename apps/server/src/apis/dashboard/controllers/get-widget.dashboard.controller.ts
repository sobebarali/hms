/**
 * Widget controller
 *
 * Handles GET /api/dashboard/widgets/:widgetId endpoint
 */

import type { Request, Response } from "express";
import { BadRequestError, UnauthorizedError } from "../../../errors";
import { createControllerLogger, logSuccess } from "../../../lib/logger";
import { getWidgetService } from "../services/get-widget.dashboard.service";
import { getWidgetSchema } from "../validations/get-widget.dashboard.validation";

const logger = createControllerLogger("dashboard-widget");

/**
 * Get widget data
 *
 * GET /api/dashboard/widgets/:widgetId
 */
export async function getWidgetController(req: Request, res: Response) {
	const startTime = Date.now();

	if (!req.user) {
		throw new UnauthorizedError("Authentication required");
	}

	// Validate request params
	const parseResult = getWidgetSchema.safeParse({ params: req.params });
	if (!parseResult.success) {
		throw new BadRequestError(
			"INVALID_WIDGET_ID",
			parseResult.error.issues[0]?.message || "Invalid widget ID",
		);
	}

	const { tenantId, roles } = req.user;
	const { widgetId } = parseResult.data.params;

	const result = await getWidgetService({
		tenantId,
		roles,
		widgetId,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{ widgetId },
		"Widget data retrieved successfully",
		duration,
	);

	res.status(200).json({
		success: true,
		data: result,
	});
}
