import { randomBytes } from "node:crypto";
import { Hospital } from "@hms/db";
import mongoose from "mongoose";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/hospitals/:id/verify - Hospital already verified", () => {
	const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
	let createdHospitalId: string;
	let verificationToken: string;

	beforeAll(async () => {
		// Ensure database connection
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(process.env.DATABASE_URL || "");
		}

		// Create a hospital that's already verified
		const hospitalId = uuidv4();
		verificationToken = randomBytes(32).toString("hex");

		const hospital = await Hospital.create({
			_id: hospitalId,
			name: `Test Hospital ${uniqueId}`,
			slug: `test-hospital-${uniqueId}`,
			licenseNumber: `LIC-${uniqueId}`,
			address: {
				street: "123 Main St",
				city: "New York",
				state: "NY",
				postalCode: "10001",
				country: "USA",
			},
			contactEmail: `contact-${uniqueId}@testhospital.com`,
			contactPhone: "+1234567890",
			adminEmail: `admin-${uniqueId}@testhospital.com`,
			adminPhone: "+1987654321",
			status: "VERIFIED", // Already verified
			verificationToken,
			verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		createdHospitalId = String(hospital._id);
	});

	afterAll(async () => {
		// Clean up created hospital
		if (createdHospitalId) {
			await Hospital.deleteOne({ _id: createdHospitalId });
		}
	});

	it("should return 409 with ALREADY_VERIFIED when hospital is already verified", async () => {
		const response = await request(app)
			.post(`/api/hospitals/${createdHospitalId}/verify`)
			.send({ token: verificationToken });

		expect(response.status).toBe(409);
		expect(response.body).toHaveProperty("code", "ALREADY_VERIFIED");
		expect(response.body).toHaveProperty("message");
		expect(response.body.message.toLowerCase()).toContain("already");
	});
});
