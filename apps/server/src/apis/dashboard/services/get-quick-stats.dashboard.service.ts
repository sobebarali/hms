/**
 * Quick stats service
 *
 * Business logic for header quick stats
 */

import { RoleNames } from "../../../constants/rbac.constants";
import { createServiceLogger } from "../../../lib/logger";
import * as repo from "../repositories/get-quick-stats.dashboard.repository";
import type { GetQuickStatsOutput } from "../validations/get-quick-stats.dashboard.validation";

const logger = createServiceLogger("dashboard-quick-stats");

/**
 * Get quick stats for header display
 */
export async function getQuickStatsService({
	tenantId,
	staffId,
	roles,
}: {
	tenantId: string;
	staffId?: string;
	roles: string[];
}): Promise<GetQuickStatsOutput> {
	logger.debug({ tenantId, roles }, "Fetching quick stats");

	let pendingTasks = 0;
	let alerts = 0;

	// Get role-specific pending tasks
	if (roles.includes(RoleNames.DOCTOR) && staffId) {
		pendingTasks = await repo.getDoctorPendingTasks({
			tenantId,
			doctorId: staffId,
		});
	} else if (roles.includes(RoleNames.PHARMACIST)) {
		pendingTasks = await repo.getPharmacistPendingTasks({ tenantId });
	} else if (roles.includes(RoleNames.NURSE)) {
		alerts = await repo.getNurseAlerts({ tenantId });
	} else if (roles.includes(RoleNames.RECEPTIONIST)) {
		pendingTasks = await repo.getReceptionistPendingTasks({ tenantId });
	}

	logger.debug({ pendingTasks, alerts }, "Quick stats fetched");

	return {
		notifications: 0, // Notifications system not implemented yet
		pendingTasks,
		alerts,
	};
}
