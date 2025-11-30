import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("GET /api/departments/:id/staff - Returns 401 without authentication", () => {
	const departmentId = uuidv4();

	it("returns 401 when no token is provided", async () => {
		const response = await request(app).get(
			`/api/departments/${departmentId}/staff`,
		);

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});

	it("returns 401 when invalid token is provided", async () => {
		const response = await request(app)
			.get(`/api/departments/${departmentId}/staff`)
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});
});
