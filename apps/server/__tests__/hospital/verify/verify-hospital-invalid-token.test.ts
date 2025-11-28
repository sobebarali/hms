import { Hospital } from "@hms/db";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/hospitals/:id/verify - Invalid or missing token", () => {
	const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
	let createdHospitalId: string;

	beforeAll(async () => {
		// Ensure database connection
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(process.env.DATABASE_URL || "");
		}

		// Create a test hospital
		const hospitalData = {
			name: `Test Hospital ${uniqueId}`,
			address: {
				street: "123 Main St",
				city: "New York",
				state: "NY",
				postalCode: "10001",
				country: "USA",
			},
			contactEmail: `contact-${uniqueId}@testhospital.com`,
			contactPhone: "+1234567890",
			licenseNumber: `LIC-${uniqueId}`,
			adminEmail: `admin-${uniqueId}@testhospital.com`,
			adminPhone: "+1987654321",
		};

		const response = await request(app)
			.post("/api/hospitals")
			.send(hospitalData);

		createdHospitalId = response.body.id;
	});

	afterAll(async () => {
		// Clean up created hospital
		if (createdHospitalId) {
			await Hospital.deleteOne({ _id: createdHospitalId });
		}
	});

	it("should return 400 with INVALID_TOKEN when token does not match", async () => {
		const response = await request(app)
			.post(`/api/hospitals/${createdHospitalId}/verify`)
			.send({ token: "invalid-token-12345" });

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("code", "INVALID_TOKEN");
		expect(response.body).toHaveProperty("message");
		expect(response.body.message.toLowerCase()).toContain("invalid");

		// Verify hospital status is still PENDING
		const hospital = await Hospital.findById(createdHospitalId);
		expect(hospital?.status).toBe("PENDING");
	});

	it("should return 400 when token is missing from request body", async () => {
		const response = await request(app)
			.post(`/api/hospitals/${createdHospitalId}/verify`)
			.send({});

		expect(response.status).toBe(400);
	});
});
