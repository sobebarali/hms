import { Hospital } from "@hms/db";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	CacheKeys,
	getCachedHospital,
	invalidateHospitalCache,
} from "../../../src/lib/cache/hospital.cache";
import { redis } from "../../../src/lib/redis";

describe("GET /api/hospitals/:id - Redis caching functionality", () => {
	const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
	let createdHospitalId: string;

	beforeAll(async () => {
		// Ensure database connection
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(process.env.DATABASE_URL || "");
		}

		// Create a test hospital
		const hospitalData = {
			name: `Cache Test Hospital ${uniqueId}`,
			address: {
				street: "456 Cache St",
				city: "Redis City",
				state: "CA",
				postalCode: "90001",
				country: "USA",
			},
			contactEmail: `cache-${uniqueId}@testhospital.com`,
			contactPhone: "+1234567890",
			licenseNumber: `CACHE-${uniqueId}`,
			adminEmail: `cache-admin-${uniqueId}@testhospital.com`,
			adminPhone: "+1987654321",
		};

		const response = await request(app)
			.post("/api/hospitals")
			.send(hospitalData);

		createdHospitalId = response.body.id;
	});

	afterAll(async () => {
		// Clean up created hospital and cache
		if (createdHospitalId) {
			await Hospital.deleteOne({ _id: createdHospitalId });
			await invalidateHospitalCache(createdHospitalId);
		}
	});

	it("should cache hospital data on first GET request", async () => {
		// Clear cache first
		await invalidateHospitalCache(createdHospitalId);

		// Verify cache is empty
		const cachedBefore = await getCachedHospital(createdHospitalId);
		expect(cachedBefore).toBeNull();

		// Make GET request - should populate cache
		const response = await request(app).get(
			`/api/hospitals/${createdHospitalId}`,
		);

		expect(response.status).toBe(200);

		// Verify cache is now populated
		const cachedAfter = await getCachedHospital(createdHospitalId);
		expect(cachedAfter).not.toBeNull();
		expect(cachedAfter).toHaveProperty("id");
	});

	it("should serve hospital data from cache on subsequent requests", async () => {
		// Make first request to populate cache
		await request(app).get(`/api/hospitals/${createdHospitalId}`);

		// Verify data is in cache
		const cached = await getCachedHospital(createdHospitalId);
		expect(cached).not.toBeNull();

		// Second request should use cache
		const response = await request(app).get(
			`/api/hospitals/${createdHospitalId}`,
		);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(createdHospitalId);
	});

	it("should invalidate cache when hospital is updated", async () => {
		// Ensure cache is populated
		await request(app).get(`/api/hospitals/${createdHospitalId}`);
		let cached = await getCachedHospital(createdHospitalId);
		expect(cached).not.toBeNull();

		// Update hospital
		const updateData = {
			contactPhone: "+9876543210",
		};

		const updateResponse = await request(app)
			.patch(`/api/hospitals/${createdHospitalId}`)
			.send(updateData);

		expect(updateResponse.status).toBe(200);

		// Cache should be invalidated (empty)
		cached = await getCachedHospital(createdHospitalId);
		expect(cached).toBeNull();
	});

	it("should invalidate cache when hospital status is updated", async () => {
		// Verify hospital first to enable status transitions
		const hospital = await Hospital.findById(createdHospitalId);
		if (hospital && hospital.status === "PENDING") {
			await Hospital.findByIdAndUpdate(createdHospitalId, {
				status: "VERIFIED",
			});
		}

		// Populate cache
		await request(app).get(`/api/hospitals/${createdHospitalId}`);
		let cached = await getCachedHospital(createdHospitalId);
		expect(cached).not.toBeNull();

		// Update status
		const statusUpdate = {
			status: "ACTIVE",
		};

		const updateResponse = await request(app)
			.patch(`/api/hospitals/${createdHospitalId}/status`)
			.send(statusUpdate);

		expect(updateResponse.status).toBe(200);

		// Cache should be invalidated
		cached = await getCachedHospital(createdHospitalId);
		expect(cached).toBeNull();
	});

	it("should have TTL set on cached hospital data", async () => {
		// Clear cache
		await invalidateHospitalCache(createdHospitalId);

		// Populate cache
		await request(app).get(`/api/hospitals/${createdHospitalId}`);

		// Check TTL
		const key = CacheKeys.hospital(createdHospitalId);
		const ttl = await redis.ttl(key);

		// TTL should be set (greater than 0) and less than or equal to 1 hour (3600 seconds)
		expect(ttl).toBeGreaterThan(0);
		expect(ttl).toBeLessThanOrEqual(3600);
	});
});
