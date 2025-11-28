import { Hospital } from "@hms/db";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/hospitals/:id/verify - Successfully verify hospital", () => {
	const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
	let createdHospitalId: string;
	let verificationToken: string;

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

		// Get the verification token from database
		const hospital = await Hospital.findById(createdHospitalId);
		verificationToken = hospital?.verificationToken || "";
	});

	afterAll(async () => {
		// Clean up created hospital
		if (createdHospitalId) {
			await Hospital.deleteOne({ _id: createdHospitalId });
		}
	});

	it("should successfully verify hospital with valid token", async () => {
		const response = await request(app)
			.post(`/api/hospitals/${createdHospitalId}/verify`)
			.send({ token: verificationToken });

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("id");
		expect(response.body.id).toBe(createdHospitalId);
		expect(response.body.status).toBe("VERIFIED");
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toContain("verified");

		// Verify database state
		const hospital = await Hospital.findById(createdHospitalId);
		expect(hospital).toBeDefined();
		expect(hospital?.status).toBe("VERIFIED");
		expect(hospital?.verificationToken).toBeUndefined();
		expect(hospital?.verificationExpires).toBeUndefined();
	});
});
