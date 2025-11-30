import { Department, Role, Staff, User } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/departments/:id - Returns 400 for department with staff", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;
	let staffUserId: string;
	let staffId: string;
	let roleId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:DELETE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create test department
		const department = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Dept With Staff ${context.uniqueId}`,
			code: `STAFF${Date.now()}`,
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		departmentId = String(department._id);

		// Create a role for the staff
		const role = await Role.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `TEST_ROLE_${context.uniqueId}`,
			description: "Test role",
			permissions: [],
			isSystem: false,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		roleId = String(role._id);

		// Create a user for staff
		const user = await User.create({
			_id: uuidv4(),
			name: "Staff User",
			email: `staff-${context.uniqueId}@test.com`,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		staffUserId = String(user._id);

		// Create staff assigned to this department
		const staff = await Staff.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			userId: staffUserId,
			employeeId: `EMP-STAFF-${context.uniqueId}`,
			firstName: "Staff",
			lastName: "Member",
			phone: "+1234567890",
			departmentId: departmentId,
			roles: [roleId],
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		staffId = String(staff._id);
	}, 30000);

	afterAll(async () => {
		if (staffId) {
			await Staff.deleteOne({ _id: staffId });
		}
		if (staffUserId) {
			await User.deleteOne({ _id: staffUserId });
		}
		if (roleId) {
			await Role.deleteOne({ _id: roleId });
		}
		if (departmentId) {
			await Department.deleteOne({ _id: departmentId });
		}
		await context.cleanup();
	});

	it("returns 400 when department has assigned staff", async () => {
		const response = await request(app)
			.delete(`/api/departments/${departmentId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("HAS_ACTIVE_STAFF");
	});
});
