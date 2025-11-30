/**
 * Widget validation
 *
 * Schema and types for GET /api/dashboard/widget/:widgetId
 */

import { z } from "zod";

export const WidgetIds = {
	PATIENT_TREND: "patient-trend",
	APPOINTMENT_TREND: "appointment-trend",
	REVENUE_TREND: "revenue-trend",
	DEPARTMENT_LOAD: "department-load",
	STAFF_ATTENDANCE: "staff-attendance",
	BED_OCCUPANCY: "bed-occupancy",
} as const;

export const getWidgetSchema = z.object({
	params: z.object({
		widgetId: z.enum([
			WidgetIds.PATIENT_TREND,
			WidgetIds.APPOINTMENT_TREND,
			WidgetIds.REVENUE_TREND,
			WidgetIds.DEPARTMENT_LOAD,
			WidgetIds.STAFF_ATTENDANCE,
			WidgetIds.BED_OCCUPANCY,
		]),
	}),
});

export type GetWidgetInput = z.infer<typeof getWidgetSchema.shape.params>;

export type GetWidgetOutput = {
	widgetId: string;
	data: unknown;
	updatedAt: string;
};
