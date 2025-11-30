import { Role } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/roles/:id - Deletes role successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let roleId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["ROLE:DELETE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create test role
		const role = await Role.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Delete Test ${context.uniqueId}`,
			description: "Role to be deleted",
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

	it("deactivates role successfully", async () => {
		const response = await request(app)
			.delete(`/api/roles/${roleId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(roleId);
		expect(response.body.isActive).toBe(false);
		expect(response.body).toHaveProperty("deactivatedAt");
	});
});
