import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("GET /api/menu - Unauthorized access", () => {
	it("returns 401 when no token is provided", async () => {
		const response = await request(app).get("/api/menu");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});

	it("returns 401 when invalid token is provided", async () => {
		const response = await request(app)
			.get("/api/menu")
			.set("Authorization", "Bearer invalid-token-12345");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});

	it("returns 401 when token format is malformed", async () => {
		const response = await request(app)
			.get("/api/menu")
			.set("Authorization", "InvalidFormat token123");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});
});
