/**
 * Widget service
 *
 * Business logic for dashboard widgets
 */

import { RoleNames } from "../../../constants/rbac.constants";
import { BadRequestError, ForbiddenError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import * as repo from "../repositories/get-widget.dashboard.repository";
import {
	type GetWidgetOutput,
	WidgetIds,
} from "../validations/get-widget.dashboard.validation";

const logger = createServiceLogger("dashboard-widget");

// Widget access by role
const WIDGET_ACCESS: Record<string, string[]> = {
	[WidgetIds.PATIENT_TREND]: [RoleNames.HOSPITAL_ADMIN, RoleNames.SUPER_ADMIN],
	[WidgetIds.APPOINTMENT_TREND]: [
		RoleNames.HOSPITAL_ADMIN,
		RoleNames.SUPER_ADMIN,
		RoleNames.DOCTOR,
	],
	[WidgetIds.REVENUE_TREND]: [RoleNames.HOSPITAL_ADMIN, RoleNames.SUPER_ADMIN],
	[WidgetIds.DEPARTMENT_LOAD]: [
		RoleNames.HOSPITAL_ADMIN,
		RoleNames.SUPER_ADMIN,
	],
	[WidgetIds.STAFF_ATTENDANCE]: [
		RoleNames.HOSPITAL_ADMIN,
		RoleNames.SUPER_ADMIN,
	],
	[WidgetIds.BED_OCCUPANCY]: [
		RoleNames.HOSPITAL_ADMIN,
		RoleNames.SUPER_ADMIN,
		RoleNames.NURSE,
	],
};

/**
 * Get widget data
 */
export async function getWidgetService({
	tenantId,
	roles,
	widgetId,
}: {
	tenantId: string;
	roles: string[];
	widgetId: string;
}): Promise<GetWidgetOutput> {
	logger.debug({ tenantId, widgetId }, "Fetching widget data");

	// Check access
	const allowedRoles = WIDGET_ACCESS[widgetId];
	if (!allowedRoles) {
		throw new BadRequestError(
			`Unknown widget ID: ${widgetId}`,
			"INVALID_WIDGET",
		);
	}

	const hasAccess = roles.some((role) => allowedRoles.includes(role));
	if (!hasAccess) {
		throw new ForbiddenError(
			"Widget not available for your role",
			"WIDGET_ACCESS_DENIED",
		);
	}

	let data: unknown;

	switch (widgetId) {
		case WidgetIds.PATIENT_TREND:
			data = await repo.getPatientTrend({ tenantId });
			break;
		case WidgetIds.APPOINTMENT_TREND:
			data = await repo.getAppointmentTrend({ tenantId });
			break;
		case WidgetIds.DEPARTMENT_LOAD:
			data = await repo.getDepartmentLoad({ tenantId });
			break;
		case WidgetIds.BED_OCCUPANCY:
			data = await repo.getBedOccupancy({ tenantId });
			break;
		case WidgetIds.STAFF_ATTENDANCE:
			data = await repo.getStaffAttendance({ tenantId });
			break;
		case WidgetIds.REVENUE_TREND:
			data = await repo.getRevenueTrend({ tenantId });
			break;
		default:
			throw new BadRequestError(
				`Unknown widget ID: ${widgetId}`,
				"INVALID_WIDGET",
			);
	}

	logger.debug({ widgetId }, "Widget data fetched successfully");

	return {
		widgetId,
		data,
		updatedAt: new Date().toISOString(),
	};
}
