import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/departments/:id/staff/:userId - Returns 403 without permission", () => {
	let context: AuthTestContext;
	let accessToken: string;
	const departmentId = uuidv4();
	const userId = uuidv4();

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "LIMITED_USER",
			rolePermissions: ["DEPARTMENT:READ"], // Has READ but not MANAGE
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 403 when user lacks DEPARTMENT:MANAGE permission", async () => {
		const response = await request(app)
			.delete(`/api/departments/${departmentId}/staff/${userId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body).toHaveProperty("code");
	});
});
