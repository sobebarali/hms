/**
 * Dashboard routes
 *
 * GET /api/dashboard - Get role-specific dashboard data
 * GET /api/dashboard/widgets/:widgetId - Get widget data
 * GET /api/dashboard/quick-stats - Get quick stats for header
 * POST /api/dashboard/refresh - Force refresh dashboard data
 */

import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { getDashboardController } from "./controllers/get.dashboard.controller";
import { getQuickStatsController } from "./controllers/get-quick-stats.dashboard.controller";
import { getWidgetController } from "./controllers/get-widget.dashboard.controller";
import { refreshDashboardController } from "./controllers/refresh.dashboard.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/dashboard - Get role-specific dashboard data
router.get("/", getDashboardController);

// GET /api/dashboard/widgets/:widgetId - Get widget data
router.get("/widgets/:widgetId", getWidgetController);

// GET /api/dashboard/quick-stats - Get quick stats for header
router.get("/quick-stats", getQuickStatsController);

// POST /api/dashboard/refresh - Force refresh dashboard data
router.post("/refresh", refreshDashboardController);

export default router;
