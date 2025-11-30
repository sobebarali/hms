import { Department, Role, Staff, User } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/departments/:id/staff - Returns staff with pagination", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;
	const staffIds: string[] = [];
	const userIds: string[] = [];
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
			name: `Pagination Department ${context.uniqueId}`,
			code: `PAG${context.uniqueId}`
				.toUpperCase()
				.replace(/-/g, "")
				.slice(0, 10),
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		departmentId = String(dept._id);

		// Create role
		const role = await Role.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `PAGINATION_ROLE_${context.uniqueId}`,
			description: "Role for pagination test",
			permissions: [],
			isSystem: false,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		staffRoleId = String(role._id);

		// Create 5 staff members
		for (let i = 0; i < 5; i++) {
			const user = await User.create({
				_id: uuidv4(),
				name: `Staff User ${i} ${context.uniqueId}`,
				email: `staff-${i}-${context.uniqueId}@test.com`,
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			userIds.push(String(user._id));

			const staff = await Staff.create({
				_id: uuidv4(),
				tenantId: context.hospitalId,
				userId: String(user._id),
				employeeId: `EMP-PAG-${i}-${context.uniqueId}`,
				firstName: `Staff${i}`,
				lastName: "Member",
				phone: `+123456789${i}`,
				departmentId: departmentId,
				roles: [staffRoleId],
				specialization: "General",
				shift: "MORNING",
				status: "ACTIVE",
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			staffIds.push(String(staff._id));
		}
	}, 30000);

	afterAll(async () => {
		for (const id of staffIds) {
			await Staff.deleteOne({ _id: id });
		}
		for (const id of userIds) {
			await User.deleteOne({ _id: id });
		}
		if (staffRoleId) {
			await Role.deleteOne({ _id: staffRoleId });
		}
		if (departmentId) {
			await Department.deleteOne({ _id: departmentId });
		}
		await context.cleanup();
	});

	it("returns paginated staff list", async () => {
		const response = await request(app)
			.get(`/api/departments/${departmentId}/staff?page=1&limit=2`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBe(2);
		expect(Number(response.body.pagination.page)).toBe(1);
		expect(Number(response.body.pagination.limit)).toBe(2);
		expect(Number(response.body.pagination.total)).toBeGreaterThanOrEqual(5);
		expect(Number(response.body.pagination.totalPages)).toBeGreaterThanOrEqual(
			3,
		);
	});
});
