import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/dispensing/:prescriptionId/dispense - Unauthorized", () => {
	it("returns 401 when no token is provided", async () => {
		const prescriptionId = uuidv4();
		const response = await request(app)
			.post(`/api/dispensing/${prescriptionId}/dispense`)
			.send({
				medicines: [
					{
						medicineId: uuidv4(),
						dispensedQuantity: 10,
					},
				],
			});

		expect(response.status).toBe(401);
	});

	it("returns 401 when invalid token is provided", async () => {
		const prescriptionId = uuidv4();
		const response = await request(app)
			.post(`/api/dispensing/${prescriptionId}/dispense`)
			.set("Authorization", "Bearer invalid-token")
			.send({
				medicines: [
					{
						medicineId: uuidv4(),
						dispensedQuantity: 10,
					},
				],
			});

		expect(response.status).toBe(401);
	});
});
