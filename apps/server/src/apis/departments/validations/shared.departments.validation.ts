import { z } from "zod";

/**
 * Shared validation schemas for departments
 */

// Operating hours schema for a single day
export const dayHoursSchema = z
	.object({
		start: z
			.string()
			.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
		end: z
			.string()
			.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
	})
	.optional();

// Weekly operating hours schema
export const operatingHoursSchema = z
	.object({
		monday: dayHoursSchema,
		tuesday: dayHoursSchema,
		wednesday: dayHoursSchema,
		thursday: dayHoursSchema,
		friday: dayHoursSchema,
		saturday: dayHoursSchema,
		sunday: dayHoursSchema,
	})
	.optional();

// Department type enum values
export const departmentTypeValues = [
	"CLINICAL",
	"ADMINISTRATIVE",
	"SUPPORT",
	"DIAGNOSTIC",
	"PHARMACY",
	"EMERGENCY",
] as const;

// Department status enum values
export const departmentStatusValues = [
	"ACTIVE",
	"INACTIVE",
	"SUSPENDED",
] as const;
