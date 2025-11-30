/**
 * Dashboard controller
 *
 * Handles GET /api/dashboard endpoint
 */

import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import { createControllerLogger, logSuccess } from "../../../lib/logger";
import { getDashboardService } from "../services/get.dashboard.service";

const logger = createControllerLogger("dashboard");

/**
 * Get role-specific dashboard data
 *
 * GET /api/dashboard
 */
export async function getDashboardController(req: Request, res: Response) {
	const startTime = Date.now();

	if (!req.user) {
		throw new UnauthorizedError("Authentication required");
	}

	const { tenantId, roles, staffId, attributes } = req.user;

	const result = await getDashboardService({
		tenantId,
		staffId,
		roles,
		attributes,
	});

	const duration = Date.now() - startTime;

	logSuccess(logger, { roles }, "Dashboard retrieved successfully", duration);

	res.status(200).json({
		success: true,
		data: result,
	});
}
