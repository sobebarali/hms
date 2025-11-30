/**
 * Quick stats validation
 *
 * Schema and types for GET /api/dashboard/quick-stats
 */

import { z } from "zod";

export const getQuickStatsSchema = z.object({});

export type GetQuickStatsOutput = {
	notifications: number;
	pendingTasks: number;
	alerts: number;
};
