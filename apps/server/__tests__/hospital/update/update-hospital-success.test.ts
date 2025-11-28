import { Hospital } from "@hms/db";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("PATCH /api/hospitals/:id - Successfully update hospital", () => {
	const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
	let createdHospitalId: string;

	beforeAll(async () => {
		// Ensure database connection
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(process.env.DATABASE_URL || "");
		}

		// Create a hospital first to update
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

	it("should successfully update hospital with valid data", async () => {
		const updateData = {
			name: `Updated Hospital ${uniqueId}`,
			contactEmail: `updated-${uniqueId}@testhospital.com`,
			contactPhone: "+9999999999",
			address: {
				street: "456 Updated St",
				city: "Los Angeles",
				state: "CA",
				postalCode: "90001",
				country: "USA",
			},
		};

		const response = await request(app)
			.patch(`/api/hospitals/${createdHospitalId}`)
			.send(updateData);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("id");
		expect(response.body.id).toBe(createdHospitalId);
		expect(response.body.name).toBe(updateData.name);
		expect(response.body.contactEmail).toBe(updateData.contactEmail);
		expect(response.body.contactPhone).toBe(updateData.contactPhone);
		expect(response.body.address.street).toBe(updateData.address.street);
		expect(response.body.address.city).toBe(updateData.address.city);
		expect(response.body).toHaveProperty("updatedAt");

		// Verify database entry
		const hospital = await Hospital.findById(createdHospitalId);
		expect(hospital).toBeDefined();
		expect(hospital?.name).toBe(updateData.name);
		expect(hospital?.contactEmail).toBe(updateData.contactEmail);
		expect(hospital?.contactPhone).toBe(updateData.contactPhone);
	});
});
