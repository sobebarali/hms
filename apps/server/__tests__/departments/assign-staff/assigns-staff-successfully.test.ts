import { Department, Role, Staff, User } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/departments/:id/staff - Assigns staff to department", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;
	let staffUserId: string;
	let staffId: string;
	let staffRoleId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:MANAGE", "DEPARTMENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create department
		const dept = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Assign Department ${context.uniqueId}`,
			code: `ASG${context.uniqueId}`
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
			name: `ASSIGN_ROLE_${context.uniqueId}`,
			description: "Role for assign test",
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
			name: `Assign User ${context.uniqueId}`,
			email: `assign-${context.uniqueId}@test.com`,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		staffUserId = String(user._id);

		// Create staff without department assignment
		const staff = await Staff.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			userId: staffUserId,
			employeeId: `EMP-ASG-${context.uniqueId}`,
			firstName: "Assign",
			lastName: "Staff",
			phone: "+1234567892",
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

	it("assigns staff to department successfully", async () => {
		const response = await request(app)
			.post(`/api/departments/${departmentId}/staff`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				userId: staffId,
				isPrimary: false,
			});

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("userId");
		expect(response.body).toHaveProperty("departmentId");
		expect(response.body.departmentId).toBe(departmentId);
		expect(response.body).toHaveProperty("assignedAt");
	});
});
