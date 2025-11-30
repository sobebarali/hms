import { Role, Staff } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/roles/:id - Returns 400 for role in use", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let roleId: string;
	let staffId: string;
	let userId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["ROLE:DELETE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a role
		const role = await Role.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Role In Use ${context.uniqueId}`,
			description: "Role assigned to user",
			permissions: ["PATIENT:READ"],
			isSystem: false,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		roleId = String(role._id);

		// Create a staff member assigned to this role
		staffId = uuidv4();
		userId = uuidv4();
		await Staff.create({
			_id: staffId,
			tenantId: context.hospitalId,
			userId: userId,
			employeeId: `EMP-${Date.now()}`,
			email: `roleinuse-${context.uniqueId}@test.com`,
			firstName: "Test",
			lastName: "User",
			phone: `+1${Date.now()}`,
			roles: [roleId],
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}, 30000);

	afterAll(async () => {
		if (staffId) {
			await Staff.deleteOne({ _id: staffId });
		}
		if (roleId) {
			await Role.deleteOne({ _id: roleId });
		}
		await context.cleanup();
	});

	it("returns 400 when trying to delete a role assigned to users", async () => {
		const response = await request(app)
			.delete(`/api/roles/${roleId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("code", "ROLE_IN_USE");
	});
});
