import { Department, Role, Staff, User } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/departments/:id/staff - Retrieves department staff", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;
	let staffUserId: string;
	let staffId: string;
	let staffRoleId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create department
		const dept = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Staff Department ${context.uniqueId}`,
			code: `STF${context.uniqueId}`
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
			name: `STAFF_ROLE_${context.uniqueId}`,
			description: "Staff role for testing",
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
			name: `Staff User ${context.uniqueId}`,
			email: `staff-${context.uniqueId}@test.com`,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		staffUserId = String(user._id);

		// Create staff assigned to the department
		const staff = await Staff.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			userId: staffUserId,
			employeeId: `EMP-STAFF-${context.uniqueId}`,
			firstName: "Staff",
			lastName: "Member",
			phone: "+1234567891",
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

	it("retrieves staff members in department", async () => {
		const response = await request(app)
			.get(`/api/departments/${departmentId}/staff`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body).toHaveProperty("pagination");
		expect(Array.isArray(response.body.data)).toBe(true);
		expect(response.body.data.length).toBeGreaterThan(0);

		const staffMember = response.body.data.find(
			(s: { id: string }) => s.id === staffId,
		);
		expect(staffMember).toBeDefined();
		expect(staffMember.name).toBe("Staff Member");
		expect(staffMember.status).toBe("ACTIVE");
	});
});
