import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("DELETE /api/departments/:id/staff/:userId - Returns 401 without authentication", () => {
	const departmentId = uuidv4();
	const userId = uuidv4();

	it("returns 401 when no token is provided", async () => {
		const response = await request(app).delete(
			`/api/departments/${departmentId}/staff/${userId}`,
		);

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});

	it("returns 401 when invalid token is provided", async () => {
		const response = await request(app)
			.delete(`/api/departments/${departmentId}/staff/${userId}`)
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});
});
