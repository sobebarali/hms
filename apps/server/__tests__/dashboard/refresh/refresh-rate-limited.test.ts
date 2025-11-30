import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/dashboard/refresh - Rate limiting", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DASHBOARD:VIEW"],
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 429 when refresh is called twice within 60 seconds", async () => {
		// First refresh should succeed
		const firstResponse = await request(app)
			.post("/api/dashboard/refresh")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(firstResponse.status).toBe(200);
		expect(firstResponse.body.success).toBe(true);
		expect(firstResponse.body.data.refreshed).toBe(true);

		// Second refresh should be rate limited
		const secondResponse = await request(app)
			.post("/api/dashboard/refresh")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(secondResponse.status).toBe(429);
		expect(secondResponse.body.code).toBe("REFRESH_RATE_LIMITED");
	});

	it("rate limit error contains proper message", async () => {
		// This call should also be rate limited (from previous test)
		const response = await request(app)
			.post("/api/dashboard/refresh")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(429);
		expect(response.body).toHaveProperty("code");
		expect(response.body).toHaveProperty("message");
	});
});
