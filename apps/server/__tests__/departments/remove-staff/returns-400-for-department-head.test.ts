import { Department, Role, Staff, User } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/departments/:id/staff/:userId - Returns 400 when removing department head", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;
	let staffUserId: string;
	let staffId: string;
	let staffRoleId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:MANAGE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create role for staff
		const role = await Role.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `HEAD_ROLE_${context.uniqueId}`,
			description: "Role for head test",
			permissions: [],
			isSystem: false,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		staffRoleId = String(role._id);

		// Create a user for the staff
		const user = await User.create({
			_id: uuidv4(),
			name: `Head User ${context.uniqueId}`,
			email: `head-${context.uniqueId}@test.com`,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		staffUserId = String(user._id);

		// Create staff
		const staff = await Staff.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			userId: staffUserId,
			employeeId: `EMP-HEAD-${context.uniqueId}`,
			firstName: "Head",
			lastName: "Staff",
			phone: "+1234567895",
			roles: [staffRoleId],
			specialization: "General",
			shift: "MORNING",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		staffId = String(staff._id);

		// Create department with the staff as head
		const dept = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Head Department ${context.uniqueId}`,
			code: `HED${context.uniqueId}`
				.toUpperCase()
				.replace(/-/g, "")
				.slice(0, 10),
			type: "CLINICAL",
			status: "ACTIVE",
			headId: staffId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		departmentId = String(dept._id);

		// Update staff with department
		await Staff.updateOne(
			{ _id: staffId },
			{ $set: { departmentId: departmentId } },
		);
	}, 30000);

	afterAll(async () => {
		if (departmentId) {
			await Department.deleteOne({ _id: departmentId });
		}
		if (staffId) {
			await Staff.deleteOne({ _id: staffId });
		}
		if (staffUserId) {
			await User.deleteOne({ _id: staffUserId });
		}
		if (staffRoleId) {
			await Role.deleteOne({ _id: staffRoleId });
		}
		await context.cleanup();
	});

	it("returns 400 when trying to remove department head", async () => {
		const response = await request(app)
			.delete(`/api/departments/${departmentId}/staff/${staffId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("code");
		expect(response.body.code).toBe("IS_HEAD");
	});
});
