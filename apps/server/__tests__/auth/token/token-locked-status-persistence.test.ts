import { Account, Hospital, Role, Staff, User } from "@hms/db";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import { lockAccount, unlockAccount } from "../../../src/lib/cache/auth.cache";

describe("POST /api/auth/token - LOCKED Status Persistence", () => {
	const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

	let hospitalId: string;
	let userId: string;
	let staffId: string;
	let roleId: string;
	let password: string;
	let userEmail: string;

	beforeAll(async () => {
		// Create test hospital
		const hospital = await Hospital.create({
			_id: `hospital-locked-${uniqueId}`,
			name: `Test Hospital ${uniqueId}`,
			slug: `test-hospital-locked-${uniqueId}`,
			licenseNumber: `LIC-LOCKED-${uniqueId}`,
			address: {
				street: "123 Test St",
				city: "Test City",
				state: "TS",
				postalCode: "12345",
				country: "USA",
			},
			contactEmail: `contact-locked-${uniqueId}@test.com`,
			contactPhone: "+1234567890",
			adminEmail: `admin-locked-${uniqueId}@test.com`,
			adminPhone: "+0987654321",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		hospitalId = String(hospital._id);

		// Create test user
		userEmail = `user-locked-${uniqueId}@test.com`;
		const user = await User.create({
			_id: `user-locked-${uniqueId}`,
			name: "Test User",
			email: userEmail,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		userId = String(user._id);

		// Create test role
		const role = await Role.create({
			_id: `role-locked-${uniqueId}`,
			tenantId: hospitalId,
			name: "DOCTOR",
			description: "Test doctor role",
			permissions: ["PATIENT:READ", "PRESCRIPTION:CREATE"],
			isSystem: false,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		roleId = String(role._id);

		// Create test staff
		const staff = await Staff.create({
			_id: `staff-locked-${uniqueId}`,
			tenantId: hospitalId,
			userId,
			employeeId: `EMP-LOCKED-${uniqueId}`,
			firstName: "Test",
			lastName: "User",
			phone: "+1234567890",
			roles: [roleId],
			specialization: "General Practice",
			shift: "MORNING",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		staffId = String(staff._id);

		// Create password and account
		password = "TestPassword123!";
		const hashedPassword = await bcrypt.hash(password, 10);

		await Account.create({
			_id: `account-locked-${uniqueId}`,
			accountId: `account-locked-${uniqueId}`,
			userId,
			providerId: "credential",
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	});

	afterAll(async () => {
		// Clean up test data
		await Account.deleteOne({ userId });
		await Staff.deleteOne({ _id: staffId });
		await Role.deleteOne({ _id: roleId });
		await User.deleteOne({ _id: userId });
		await Hospital.deleteOne({ _id: hospitalId });
	});

	it("should persist LOCKED status to database when account is locked", async () => {
		// Verify staff status is ACTIVE before locking
		const staffBefore = await Staff.findById(staffId).lean();
		expect(staffBefore?.status).toBe("ACTIVE");

		// Lock the account
		await lockAccount({ identifier: userEmail });

		// Verify LOCKED status is persisted in database
		const staffAfter = await Staff.findById(staffId).lean();
		expect(staffAfter?.status).toBe("LOCKED");

		// Verify login is rejected with LOCKED status
		const response = await request(app).post("/api/auth/token").send({
			grant_type: "password",
			username: userEmail,
			password,
			tenant_id: hospitalId,
		});

		expect(response.status).toBe(403);
		expect(response.body).toHaveProperty("code", "ACCOUNT_LOCKED");
	});

	it("should reset status to ACTIVE when account is unlocked", async () => {
		// Verify staff status is LOCKED
		const staffBefore = await Staff.findById(staffId).lean();
		expect(staffBefore?.status).toBe("LOCKED");

		// Unlock the account
		await unlockAccount({ identifier: userEmail });

		// Verify status is reset to ACTIVE in database
		const staffAfter = await Staff.findById(staffId).lean();
		expect(staffAfter?.status).toBe("ACTIVE");

		// Verify login succeeds after unlocking
		const response = await request(app).post("/api/auth/token").send({
			grant_type: "password",
			username: userEmail,
			password,
			tenant_id: hospitalId,
		});

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("access_token");
		expect(response.body).toHaveProperty("refresh_token");
	});

	it("should reject login when staff has LOCKED status in database even without Redis lock", async () => {
		// Directly set LOCKED status in database (simulating Redis cache expiry)
		await Staff.findByIdAndUpdate(staffId, { status: "LOCKED" });

		// Verify login is rejected based on database status
		const response = await request(app).post("/api/auth/token").send({
			grant_type: "password",
			username: userEmail,
			password,
			tenant_id: hospitalId,
		});

		expect(response.status).toBe(403);
		expect(response.body).toHaveProperty("code", "ACCOUNT_LOCKED");

		// Reset status for cleanup
		await Staff.findByIdAndUpdate(staffId, { status: "ACTIVE" });
	});
});
