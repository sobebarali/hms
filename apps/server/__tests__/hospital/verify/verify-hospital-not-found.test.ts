import mongoose from "mongoose";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/hospitals/:id/verify - Hospital not found", () => {
	beforeAll(async () => {
		// Ensure database connection
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(process.env.DATABASE_URL || "");
		}
	});

	it("should return 404 with NOT_FOUND when hospital does not exist", async () => {
		const nonExistentId = uuidv4();

		const response = await request(app)
			.post(`/api/hospitals/${nonExistentId}/verify`)
			.send({ token: "some-token" });

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("code", "NOT_FOUND");
		expect(response.body).toHaveProperty("message");
		expect(response.body.message.toLowerCase()).toContain("not found");
	});
});
