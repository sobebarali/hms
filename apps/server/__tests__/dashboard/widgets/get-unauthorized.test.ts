import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("GET /api/dashboard/widgets/:widgetId - Unauthorized", () => {
	it("returns 401 when no auth token provided", async () => {
		const response = await request(app).get(
			"/api/dashboard/widgets/patient-trend",
		);

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});
});
