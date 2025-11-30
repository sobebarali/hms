/**
 * Quick stats controller
 *
 * Handles GET /api/dashboard/quick-stats endpoint
 */

import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import { createControllerLogger, logSuccess } from "../../../lib/logger";
import { getQuickStatsService } from "../services/get-quick-stats.dashboard.service";

const logger = createControllerLogger("dashboard-quick-stats");

/**
 * Get quick stats for header display
 *
 * GET /api/dashboard/quick-stats
 */
export async function getQuickStatsController(req: Request, res: Response) {
	const startTime = Date.now();

	if (!req.user) {
		throw new UnauthorizedError("Authentication required");
	}

	const { tenantId, roles, staffId } = req.user;

	const result = await getQuickStatsService({
		tenantId,
		staffId,
		roles,
	});

	const duration = Date.now() - startTime;

	logSuccess(logger, { roles }, "Quick stats retrieved successfully", duration);

	res.status(200).json({
		success: true,
		data: result,
	});
}
