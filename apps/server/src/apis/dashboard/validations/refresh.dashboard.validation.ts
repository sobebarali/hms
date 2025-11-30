/**
 * Refresh dashboard validation
 *
 * Schema and types for POST /api/dashboard/refresh
 */

import { z } from "zod";

export const refreshDashboardSchema = z.object({});

export type RefreshDashboardOutput = {
	refreshed: boolean;
	timestamp: string;
};
