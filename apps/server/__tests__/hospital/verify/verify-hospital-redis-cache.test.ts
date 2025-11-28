import { Hospital } from "@hms/db";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	getVerificationToken,
	setVerificationToken,
} from "../../../src/lib/cache/hospital.cache";

describe("POST /api/hospitals/:id/verify - Verification token caching", () => {
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
			name: `Token Cache Hospital ${uniqueId}`,
			address: {
				street: "789 Token St",
				city: "Cache City",
				state: "TX",
				postalCode: "75001",
				country: "USA",
			},
			contactEmail: `token-${uniqueId}@testhospital.com`,
			contactPhone: "+1234567890",
			licenseNumber: `TOKEN-${uniqueId}`,
			adminEmail: `token-admin-${uniqueId}@testhospital.com`,
			adminPhone: "+1987654321",
		};

		const response = await request(app)
			.post("/api/hospitals")
			.send(hospitalData);

		createdHospitalId = response.body.id;

		// Get verification token from database
		const hospital = await Hospital.findById(createdHospitalId);
		verificationToken = hospital?.verificationToken || "";
	});

	afterAll(async () => {
		// Clean up created hospital
		if (createdHospitalId) {
			await Hospital.deleteOne({ _id: createdHospitalId });
		}
	});

	it("should store verification token in Redis when hospital is registered", async () => {
		// Verification token should be in Redis
		const cachedToken = await getVerificationToken(createdHospitalId);
		expect(cachedToken).toBe(verificationToken);
	});

	it("should verify hospital using token from Redis", async () => {
		// Manually set a token in Redis
		const testToken = "test-redis-token-123";
		await setVerificationToken(createdHospitalId, testToken, 3600);

		// Verify using the Redis token (not the database token)
		const verifyResponse = await request(app)
			.post(`/api/hospitals/${createdHospitalId}/verify`)
			.send({ token: testToken });

		expect(verifyResponse.status).toBe(200);
		expect(verifyResponse.body).toHaveProperty("message");
		expect(verifyResponse.body.status).toBe("VERIFIED");
	});

	it("should delete verification token from Redis after successful verification", async () => {
		// Create another hospital for this test
		const newUniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
		const hospitalData = {
			name: `Delete Token Hospital ${newUniqueId}`,
			address: {
				street: "321 Delete St",
				city: "Clear City",
				state: "FL",
				postalCode: "33001",
				country: "USA",
			},
			contactEmail: `delete-${newUniqueId}@testhospital.com`,
			contactPhone: "+1234567890",
			licenseNumber: `DELETE-${newUniqueId}`,
			adminEmail: `delete-admin-${newUniqueId}@testhospital.com`,
			adminPhone: "+1987654321",
		};

		const createResponse = await request(app)
			.post("/api/hospitals")
			.send(hospitalData);

		const newHospitalId = createResponse.body.id;

		// Get verification token
		const hospital = await Hospital.findById(newHospitalId);
		const token = hospital?.verificationToken || "";

		// Verify token is in Redis
		let cachedToken = await getVerificationToken(newHospitalId);
		expect(cachedToken).toBe(token);

		// Verify the hospital
		await request(app)
			.post(`/api/hospitals/${newHospitalId}/verify`)
			.send({ token });

		// Token should be removed from Redis
		cachedToken = await getVerificationToken(newHospitalId);
		expect(cachedToken).toBeNull();

		// Clean up
		await Hospital.deleteOne({ _id: newHospitalId });
	});
});
