import { Role } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/roles/:id - Returns 403 for system role", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let systemRoleId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["ROLE:DELETE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a system role
		const role = await Role.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `System Role Delete ${context.uniqueId}`,
			description: "A system role",
			permissions: ["PATIENT:READ"],
			isSystem: true,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		systemRoleId = String(role._id);
	}, 30000);

	afterAll(async () => {
		if (systemRoleId) {
			await Role.deleteOne({ _id: systemRoleId });
		}
		await context.cleanup();
	});

	it("returns 403 when trying to delete a system role", async () => {
		const response = await request(app)
			.delete(`/api/roles/${systemRoleId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body).toHaveProperty("code", "SYSTEM_ROLE");
	});
});
