import { Account, Department, Hospital, Role, Staff, User } from "@hms/db";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/hospitals/:id/verify - Successfully verify hospital with tenant provisioning", () => {
	const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
	let createdHospitalId: string;
	let verificationToken: string;
	const adminEmail = `admin-${uniqueId}@testhospital.com`;

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
			adminEmail,
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
		// Clean up created records in correct order (respecting foreign key relationships)
		if (createdHospitalId) {
			// Find and delete the admin user created during provisioning
			const user = await User.findOne({ email: adminEmail });
			if (user) {
				await Staff.deleteMany({ tenantId: createdHospitalId });
				await Account.deleteMany({ userId: String(user._id) });
				await User.deleteOne({ _id: user._id });
			}

			// Delete roles and departments
			await Role.deleteMany({ tenantId: createdHospitalId });
			await Department.deleteMany({ tenantId: createdHospitalId });

			// Delete the hospital
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

		// Verify database state - hospital status updated
		const hospital = await Hospital.findById(createdHospitalId);
		expect(hospital).toBeDefined();
		expect(hospital?.status).toBe("VERIFIED");
		expect(hospital?.verificationToken).toBeUndefined();
		expect(hospital?.verificationExpires).toBeUndefined();
	});

	it("should have seeded system roles for the tenant", async () => {
		const roles = await Role.find({
			tenantId: createdHospitalId,
			isSystem: true,
		}).lean();

		expect(roles.length).toBeGreaterThanOrEqual(6);

		const roleNames = roles.map((r) => r.name);
		expect(roleNames).toContain("SUPER_ADMIN");
		expect(roleNames).toContain("HOSPITAL_ADMIN");
		expect(roleNames).toContain("DOCTOR");
		expect(roleNames).toContain("NURSE");
		expect(roleNames).toContain("PHARMACIST");
		expect(roleNames).toContain("RECEPTIONIST");
	});

	it("should have created default Administration department", async () => {
		const department = await Department.findOne({
			tenantId: createdHospitalId,
			code: "ADMIN",
		}).lean();

		expect(department).toBeDefined();
		expect(department?.name).toBe("Administration");
		expect(department?.type).toBe("ADMINISTRATIVE");
		expect(department?.status).toBe("ACTIVE");
	});

	it("should have created admin user with HOSPITAL_ADMIN role", async () => {
		// Find the admin user
		const user = await User.findOne({ email: adminEmail }).lean();
		expect(user).toBeDefined();
		expect(user?.emailVerified).toBe(true);

		// Find the staff record
		const staff = await Staff.findOne({
			tenantId: createdHospitalId,
			userId: String(user?._id),
		}).lean();

		expect(staff).toBeDefined();
		expect(staff?.employeeId).toBe("EMP-00001");
		expect(staff?.status).toBe("ACTIVE");
		expect(staff?.forcePasswordChange).toBe(true);

		// Verify staff has HOSPITAL_ADMIN role
		const hospitalAdminRole = await Role.findOne({
			tenantId: createdHospitalId,
			name: "HOSPITAL_ADMIN",
			isSystem: true,
		}).lean();

		expect(hospitalAdminRole).toBeDefined();
		expect(staff?.roles).toContain(String(hospitalAdminRole?._id));
	});

	it("should have created account with hashed password", async () => {
		const user = await User.findOne({ email: adminEmail }).lean();
		expect(user).toBeDefined();

		const account = await Account.findOne({
			userId: String(user?._id),
			providerId: "credential",
		}).lean();

		expect(account).toBeDefined();
		expect(account?.password).toBeDefined();
		// Password should be hashed (bcrypt hash starts with $2)
		expect(account?.password).toMatch(/^\$2[aby]\$/);
	});
});
