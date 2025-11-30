import { Account, Hospital, Role, User } from "@hms/db";
import bcrypt from "bcryptjs";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("GET /api/dashboard - Doctor without staffId", () => {
	const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	let hospitalId: string;
	let userId: string;
	let roleId: string;

	beforeAll(async () => {
		hospitalId = uuidv4();
		userId = uuidv4();
		roleId = uuidv4();

		const now = new Date();

		await Hospital.create({
			_id: hospitalId,
			name: `Test Hospital ${uniqueId}`,
			slug: `test-hospital-${uniqueId}`,
			licenseNumber: `LIC-${uniqueId}`,
			address: {
				street: "123 Test St",
				city: "Test City",
				state: "TS",
				postalCode: "12345",
				country: "USA",
			},
			contactEmail: `contact-${uniqueId}@test.com`,
			contactPhone: "+1234567890",
			adminEmail: `admin-${uniqueId}@test.com`,
			adminPhone: "+0987654321",
			status: "ACTIVE",
			createdAt: now,
			updatedAt: now,
		});

		await User.create({
			_id: userId,
			name: "Test Doctor",
			email: `doctor-${uniqueId}@test.com`,
			emailVerified: true,
			createdAt: now,
			updatedAt: now,
		});

		await Role.create({
			_id: roleId,
			tenantId: hospitalId,
			name: "DOCTOR",
			description: "Doctor role",
			permissions: [
				"DASHBOARD:VIEW",
				"PATIENT:READ",
				"APPOINTMENT:READ",
				"PRESCRIPTION:READ",
			],
			isSystem: true,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		const hashedPassword = await bcrypt.hash("TestPassword123!", 10);
		const accountId = uuidv4();

		await Account.create({
			_id: accountId,
			accountId: accountId,
			userId: userId,
			providerId: "credential",
			password: hashedPassword,
			createdAt: now,
			updatedAt: now,
		});

		// Note: No Staff record created intentionally
	}, 30000);

	afterAll(async () => {
		await Account.deleteOne({ userId });
		await Role.deleteOne({ _id: roleId });
		await User.deleteOne({ _id: userId });
		await Hospital.deleteOne({ _id: hospitalId });
	});

	it("returns 403 when doctor user has no staff record", async () => {
		// First, get a token for this doctor user
		// Since there's no staff record, the token endpoint should fail
		const tokenResponse = await request(app)
			.post("/api/auth/token")
			.send({
				grant_type: "password",
				username: `doctor-${uniqueId}@test.com`,
				password: "TestPassword123!",
				tenant_id: hospitalId,
			});

		// Should fail because no staff record exists - API returns 403
		expect(tokenResponse.status).toBe(403);
		expect(tokenResponse.body).toHaveProperty("code");
	});
});
