import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/dashboard/refresh - Unauthorized", () => {
	it("returns 401 when no auth token provided", async () => {
		const response = await request(app).post("/api/dashboard/refresh");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});
});
