import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import { redis } from "../../../src/lib/redis";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/dashboard/refresh - After cooldown", () => {
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

	it("allows refresh after cooldown key is cleared", async () => {
		// First refresh should succeed
		const firstResponse = await request(app)
			.post("/api/dashboard/refresh")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(firstResponse.status).toBe(200);

		// Clear the rate limit key from Redis to simulate cooldown expiry
		const cooldownKey = `tenant:${context.hospitalId}:dashboard:refresh:${context.userId}`;
		await redis.del(cooldownKey);

		// Now refresh should work again
		const secondResponse = await request(app)
			.post("/api/dashboard/refresh")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(secondResponse.status).toBe(200);
		expect(secondResponse.body.success).toBe(true);
		expect(secondResponse.body.data.refreshed).toBe(true);
	});

	it("returns correct response structure after cooldown", async () => {
		// Clear cooldown first
		const cooldownKey = `tenant:${context.hospitalId}:dashboard:refresh:${context.userId}`;
		await redis.del(cooldownKey);

		const response = await request(app)
			.post("/api/dashboard/refresh")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("refreshed");
		expect(response.body.data).toHaveProperty("timestamp");
		expect(response.body.data.refreshed).toBe(true);
		expect(typeof response.body.data.timestamp).toBe("string");
	});
});
