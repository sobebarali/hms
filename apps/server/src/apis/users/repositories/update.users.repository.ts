import { Staff } from "@hms/db";
import {
	createRepositoryLogger,
	logDatabaseOperation,
	logError,
} from "../../../lib/logger";
import type { UpdateUserInput } from "../validations/update.users.validation";

const logger = createRepositoryLogger("updateUser");

/**
 * Update staff record
 */
export async function updateStaff({
	tenantId,
	staffId,
	data,
}: {
	tenantId: string;
	staffId: string;
	data: UpdateUserInput;
}) {
	try {
		logger.debug({ tenantId, staffId }, "Updating staff");

		const updateData: Record<string, unknown> = {
			updatedAt: new Date(),
		};

		if (data.firstName !== undefined) updateData.firstName = data.firstName;
		if (data.lastName !== undefined) updateData.lastName = data.lastName;
		if (data.phone !== undefined) updateData.phone = data.phone;
		if (data.department !== undefined)
			updateData.departmentId = data.department;
		if (data.roles !== undefined) updateData.roles = data.roles;
		if (data.specialization !== undefined)
			updateData.specialization = data.specialization;
		if (data.shift !== undefined) updateData.shift = data.shift;

		const staff = await Staff.findOneAndUpdate(
			{ _id: staffId, tenantId },
			{ $set: updateData },
			{ new: true },
		).lean();

		logDatabaseOperation(
			logger,
			"findOneAndUpdate",
			"staff",
			{ tenantId, staffId },
			staff ? { _id: staff._id, updated: true } : { updated: false },
		);

		return staff;
	} catch (error) {
		logError(logger, error, "Failed to update staff", { tenantId, staffId });
		throw error;
	}
}
