import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/departments - Returns 403 without permission", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "NURSE",
			rolePermissions: ["PATIENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 403 when user lacks DEPARTMENT:CREATE permission", async () => {
		const payload = {
			name: `Test Department ${context.uniqueId}`,
			code: `TEST-${context.uniqueId}`.toUpperCase().replace(/-/g, ""),
			type: "CLINICAL",
		};

		const response = await request(app)
			.post("/api/departments")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(403);
	});
});
