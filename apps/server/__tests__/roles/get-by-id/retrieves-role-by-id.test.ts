import { Role } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/roles/:id - Retrieves role by ID", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let roleId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["ROLE:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create test role
		const role = await Role.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Get By ID Test ${context.uniqueId}`,
			description: "Test role for get by ID",
			permissions: ["PATIENT:READ", "PATIENT:CREATE"],
			isSystem: false,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		roleId = String(role._id);
	}, 30000);

	afterAll(async () => {
		if (roleId) {
			await Role.deleteOne({ _id: roleId });
		}
		await context.cleanup();
	});

	it("retrieves role details successfully", async () => {
		const response = await request(app)
			.get(`/api/roles/${roleId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(roleId);
		expect(response.body.name).toContain("Get By ID Test");
		expect(response.body.description).toBe("Test role for get by ID");
		expect(response.body.permissions).toContain("PATIENT:READ");
		expect(response.body.permissions).toContain("PATIENT:CREATE");
		expect(response.body.isSystem).toBe(false);
		expect(response.body.isActive).toBe(true);
		expect(response.body).toHaveProperty("usersCount");
		expect(response.body).toHaveProperty("createdAt");
		expect(response.body).toHaveProperty("updatedAt");
	});
});
