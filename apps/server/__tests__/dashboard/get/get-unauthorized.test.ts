import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("GET /api/dashboard - Unauthorized", () => {
	it("returns 401 when no auth token provided", async () => {
		const response = await request(app).get("/api/dashboard");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});

	it("returns 401 when invalid auth token provided", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});
});
