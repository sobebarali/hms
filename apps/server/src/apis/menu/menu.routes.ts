/**
 * Menu routes
 *
 * GET /api/menu - Get role-based menu for authenticated user
 */

import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { getMenuController } from "./controllers/get.menu.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/menu - Get menu for authenticated user
router.get("/", getMenuController);

export default router;
