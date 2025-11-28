import mongoose from "mongoose";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("PATCH /api/hospitals/:id - Invalid hospital ID format", () => {
	beforeAll(async () => {
		// Ensure database connection
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(process.env.DATABASE_URL || "");
		}
	});

	it("should return 400 when hospital ID is invalid", async () => {
		const invalidId = "invalid-id-format";
		const updateData = {
			name: "Updated Hospital Name",
		};

		const response = await request(app)
			.patch(`/api/hospitals/${invalidId}`)
			.send(updateData);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("code");
		expect(response.body.code).toBe("INVALID_REQUEST");
		expect(response.body).toHaveProperty("errors");
	});

	it("should return 400 when hospital ID is in wrong format", async () => {
		const updateData = {
			name: "Updated Hospital Name",
		};

		const response = await request(app)
			.patch("/api/hospitals/123-456")
			.send(updateData);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("code");
		expect(response.body.code).toBe("INVALID_REQUEST");
	});
});
