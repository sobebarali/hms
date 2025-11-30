import { Department, Role, Staff, User } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/departments/:id/staff - Returns 400 for already assigned user", () => {
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

		// Create department
		const dept = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Already Assigned Department ${context.uniqueId}`,
			code: `ALR${context.uniqueId}`
				.toUpperCase()
				.replace(/-/g, "")
				.slice(0, 10),
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		departmentId = String(dept._id);

		// Create role for staff
		const role = await Role.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `ALREADY_ROLE_${context.uniqueId}`,
			description: "Role for already assigned test",
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
			name: `Already User ${context.uniqueId}`,
			email: `already-${context.uniqueId}@test.com`,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		staffUserId = String(user._id);

		// Create staff already assigned to the department
		const staff = await Staff.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			userId: staffUserId,
			employeeId: `EMP-ALR-${context.uniqueId}`,
			firstName: "Already",
			lastName: "Assigned",
			phone: "+1234567893",
			departmentId: departmentId,
			roles: [staffRoleId],
			specialization: "General",
			shift: "MORNING",
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
		if (staffRoleId) {
			await Role.deleteOne({ _id: staffRoleId });
		}
		if (departmentId) {
			await Department.deleteOne({ _id: departmentId });
		}
		await context.cleanup();
	});

	it("returns 400 when user is already assigned to the department", async () => {
		const response = await request(app)
			.post(`/api/departments/${departmentId}/staff`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				userId: staffId,
			});

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("code");
		expect(response.body.code).toBe("ALREADY_ASSIGNED");
	});
});
