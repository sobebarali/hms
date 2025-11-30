import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/departments/:id - Returns 403 without permission", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "NURSE",
			rolePermissions: ["DEPARTMENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 403 when user lacks DEPARTMENT:DELETE permission", async () => {
		const response = await request(app)
			.delete(`/api/departments/${uuidv4()}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
	});
});
