import { Role } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/roles/:id - Updates role successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let roleId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: [
				"ROLE:UPDATE",
				"ROLE:READ",
				"PATIENT:READ",
				"PATIENT:CREATE",
			],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create test role
		const role = await Role.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Update Test ${context.uniqueId}`,
			description: "Original description",
			permissions: ["PATIENT:READ"],
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

	it("updates role successfully", async () => {
		const updatePayload = {
			name: `Updated Role ${context.uniqueId}`,
			description: "Updated description",
			permissions: ["PATIENT:READ", "PATIENT:CREATE"],
		};

		const response = await request(app)
			.patch(`/api/roles/${roleId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(updatePayload);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(roleId);
		expect(response.body.name).toBe(updatePayload.name);
		expect(response.body.description).toBe(updatePayload.description);
		expect(response.body.permissions).toContain("PATIENT:READ");
		expect(response.body.permissions).toContain("PATIENT:CREATE");
		expect(response.body).toHaveProperty("updatedAt");
	});
});
