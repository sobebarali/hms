import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/departments - Returns 401 without authentication", () => {
	it("returns 401 when no authorization header is provided", async () => {
		const payload = {
			name: "Test Department",
			code: "TEST-DEPT",
			type: "CLINICAL",
		};

		const response = await request(app).post("/api/departments").send(payload);

		expect(response.status).toBe(401);
	});
});
