import { Hospital } from "@hms/db";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("PATCH /api/hospitals/:id - License number immutability", () => {
	const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
	let createdHospitalId: string;
	const originalLicenseNumber = `LIC-${uniqueId}`;

	beforeAll(async () => {
		// Ensure database connection
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(process.env.DATABASE_URL || "");
		}

		// Create a hospital first
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
			licenseNumber: originalLicenseNumber,
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

	it("should reject update when trying to modify license number", async () => {
		const updateData = {
			name: "Updated Hospital Name",
			licenseNumber: "NEW-LICENSE-123",
		};

		const response = await request(app)
			.patch(`/api/hospitals/${createdHospitalId}`)
			.send(updateData);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("errors");

		// Verify license number hasn't changed in database
		const hospital = await Hospital.findById(createdHospitalId);
		expect(hospital?.licenseNumber).toBe(originalLicenseNumber);
	});
});
