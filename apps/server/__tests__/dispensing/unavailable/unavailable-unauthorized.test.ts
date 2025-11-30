import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/dispensing/:prescriptionId/unavailable - Unauthorized", () => {
	it("returns 401 when no token is provided", async () => {
		const prescriptionId = uuidv4();
		const response = await request(app)
			.post(`/api/dispensing/${prescriptionId}/unavailable`)
			.send({
				medicineId: uuidv4(),
				reason: "Out of stock",
			});

		expect(response.status).toBe(401);
	});

	it("returns 401 when invalid token is provided", async () => {
		const prescriptionId = uuidv4();
		const response = await request(app)
			.post(`/api/dispensing/${prescriptionId}/unavailable`)
			.set("Authorization", "Bearer invalid-token")
			.send({
				medicineId: uuidv4(),
				reason: "Out of stock",
			});

		expect(response.status).toBe(401);
	});
});
