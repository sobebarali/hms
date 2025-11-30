import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("GET /api/departments/tree - Returns 401 without authentication", () => {
	it("returns 401 when no token is provided", async () => {
		const response = await request(app).get("/api/departments/tree");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});

	it("returns 401 when invalid token is provided", async () => {
		const response = await request(app)
			.get("/api/departments/tree")
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});
});
