import { Role } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/roles - Lists roles successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	const createdRoleIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["ROLE:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create test roles
		for (let i = 0; i < 3; i++) {
			const role = await Role.create({
				_id: uuidv4(),
				tenantId: context.hospitalId,
				name: `List Test Role ${i} ${context.uniqueId}`,
				description: `Test role ${i}`,
				permissions: ["PATIENT:READ"],
				isSystem: false,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			createdRoleIds.push(String(role._id));
		}
	}, 30000);

	afterAll(async () => {
		for (const id of createdRoleIds) {
			await Role.deleteOne({ _id: id });
		}
		await context.cleanup();
	});

	it("lists roles successfully", async () => {
		const response = await request(app)
			.get("/api/roles")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body).toHaveProperty("pagination");
		expect(Array.isArray(response.body.data)).toBe(true);
		expect(response.body.data.length).toBeGreaterThanOrEqual(3);
		expect(response.body.pagination).toHaveProperty("page");
		expect(response.body.pagination).toHaveProperty("limit");
		expect(response.body.pagination).toHaveProperty("total");
		expect(response.body.pagination).toHaveProperty("totalPages");

		// Verify role object structure
		const role = response.body.data[0];
		expect(role).toHaveProperty("id");
		expect(role).toHaveProperty("name");
		expect(role).toHaveProperty("permissions");
		expect(role).toHaveProperty("isSystem");
		expect(role).toHaveProperty("isActive");
	});
});
