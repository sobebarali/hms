/**
 * Refresh dashboard controller
 *
 * Handles POST /api/dashboard/refresh endpoint
 */

import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import { createControllerLogger, logSuccess } from "../../../lib/logger";
import { refreshDashboardService } from "../services/refresh.dashboard.service";

const logger = createControllerLogger("dashboard-refresh");

/**
 * Force refresh dashboard data
 *
 * POST /api/dashboard/refresh
 */
export async function refreshDashboardController(req: Request, res: Response) {
	const startTime = Date.now();

	if (!req.user) {
		throw new UnauthorizedError("Authentication required");
	}

	const { id, tenantId } = req.user;

	const result = await refreshDashboardService({
		tenantId,
		userId: id,
	});

	const duration = Date.now() - startTime;

	logSuccess(logger, { userId: id }, "Dashboard refresh completed", duration);

	res.status(200).json({
		success: true,
		data: result,
	});
}
