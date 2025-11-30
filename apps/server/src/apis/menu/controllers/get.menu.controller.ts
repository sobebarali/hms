/**
 * Menu controller
 *
 * Handles GET /api/menu endpoint
 */

import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../errors";
import { createControllerLogger, logSuccess } from "../../../lib/logger";
import { getMenuForUser } from "../services/get.menu.service";

const logger = createControllerLogger("menu");

/**
 * Get menu for authenticated user
 *
 * GET /api/menu
 */
export async function getMenuController(req: Request, res: Response) {
	const startTime = Date.now();

	// User should be set by authenticate middleware
	if (!req.user?.permissions) {
		throw new UnauthorizedError("Authentication required");
	}

	const result = getMenuForUser({
		permissions: req.user.permissions,
	});

	const duration = Date.now() - startTime;

	logSuccess(
		logger,
		{ menuItemsCount: result.menu.length },
		"Menu retrieved successfully",
		duration,
	);

	res.status(200).json({
		success: true,
		data: result,
	});
}
