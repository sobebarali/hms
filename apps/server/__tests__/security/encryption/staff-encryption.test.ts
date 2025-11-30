import { Department, Role, Staff } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthTestContext } from "../../helpers/auth-test-context";
import { createAuthTestContext } from "../../helpers/auth-test-context";
import {
	type EncryptionTestContext,
	getEncryptedValueFromDb,
	getRawDocumentFromDb,
	setupEncryptionTestKey,
	verifyFieldDecrypted,
	verifyFieldEncrypted,
} from "../../helpers/encryption-test-helper";

describe("Staff Model - Field Encryption", () => {
	let context: AuthTestContext;
	let encContext: EncryptionTestContext;
	let staffId: string;
	let departmentId: string;
	let roleId: string;

	beforeAll(async () => {
		// Setup encryption key for tests
		encContext = setupEncryptionTestKey();

		// Create test context
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["STAFF:CREATE", "STAFF:READ"],
			createStaff: false, // We'll create staff manually
		});

		// Create department for staff
		const department = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Department ${Date.now()}`,
			code: `DEPT-${Date.now()}`,
			description: "Test Department",
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		departmentId = String(department._id);

		// Create role for staff
		const role = await Role.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `TEST_ROLE_${Date.now()}`,
			description: "Test role for encryption tests",
			permissions: ["PATIENT:READ"],
			isSystem: false,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		roleId = String(role._id);
	});

	afterAll(async () => {
		// Clean up staff
		if (staffId) {
			await Staff.deleteOne({ _id: staffId });
		}

		// Clean up department and role
		if (departmentId) {
			await Department.deleteOne({ _id: departmentId });
		}
		if (roleId) {
			await Role.deleteOne({ _id: roleId });
		}

		// Clean up context
		await context.cleanup();

		// Restore original encryption key
		encContext.restoreKey();
	});

	it("should encrypt phone field at rest", async () => {
		// Create staff with phone number
		staffId = uuidv4();
		const staffData = {
			_id: staffId,
			tenantId: context.hospitalId,
			userId: context.userId,
			employeeId: `EMP-${Date.now()}`,
			firstName: "Test",
			lastName: "Staff",
			phone: "+1234567890",
			departmentId: departmentId,
			roles: [roleId],
			specialization: "General Practice",
			shift: "MORNING",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await Staff.create(staffData);

		// Get raw database value (bypassing Mongoose decryption)
		const rawPhone = await getEncryptedValueFromDb("staff", staffId, "phone");

		// Verify phone is encrypted with "enc:" prefix
		expect(rawPhone).toMatch(/^enc:/);
	});

	it("should decrypt phone field when retrieved via Mongoose", async () => {
		// Retrieve staff via Mongoose (should auto-decrypt)
		const staff = await Staff.findById(staffId);

		expect(staff).toBeDefined();
		expect(staff?.phone).toBe("+1234567890");

		// Verify phone is decrypted (no "enc:" prefix)
		expect(staff?.phone).not.toMatch(/^enc:/);
	});

	it("should re-encrypt phone on update", async () => {
		// Update staff phone
		await Staff.findByIdAndUpdate(staffId, {
			phone: "+0987654321",
		});

		// Get raw value after update
		const rawPhone = await getEncryptedValueFromDb("staff", staffId, "phone");

		// Verify it's still encrypted
		expect(rawPhone).toMatch(/^enc:/);

		// Verify decrypted value is updated
		const staff = await Staff.findById(staffId);
		expect(staff?.phone).toBe("+0987654321");
	});

	it("should keep other fields unencrypted", async () => {
		const staff = await Staff.findById(staffId);

		// Non-encrypted fields should be plaintext
		expect(staff?.employeeId).toBe(staff?.employeeId);
		expect(staff?.firstName).toBe("Test");
		expect(staff?.lastName).toBe("Staff");
		expect(staff?.specialization).toBe("General Practice");
		expect(staff?.shift).toBe("MORNING");
		expect(staff?.status).toBe("ACTIVE");

		// Verify they don't have "enc:" prefix
		expect(staff?.employeeId).not.toMatch(/^enc:/);
		expect(staff?.firstName).not.toMatch(/^enc:/);
		expect(staff?.lastName).not.toMatch(/^enc:/);
	});

	it("should verify phone encryption in raw database", async () => {
		const rawDoc = await getRawDocumentFromDb("staff", staffId);

		// Test verifyFieldEncrypted helper
		expect(verifyFieldEncrypted(rawDoc, "phone")).toBe(true);

		// Non-encrypted fields should return false
		expect(verifyFieldEncrypted(rawDoc, "employeeId")).toBe(false);
		expect(verifyFieldEncrypted(rawDoc, "firstName")).toBe(false);
		expect(verifyFieldEncrypted(rawDoc, "lastName")).toBe(false);
	});

	it("should verify phone decryption in retrieved document", async () => {
		const staff = await Staff.findById(staffId);

		// Test verifyFieldDecrypted helper
		expect(verifyFieldDecrypted(staff, "phone", "+0987654321")).toBe(true);
	});

	it("should handle empty phone field gracefully", async () => {
		// Create a separate user for temp staff to avoid duplicate key error
		const { User } = await import("@hms/db");
		const tempUserId = uuidv4();
		await User.create({
			_id: tempUserId,
			name: "Temp User",
			email: `temp-${Date.now()}@test.com`,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create staff without phone (should not crash)
		const tempStaffId = uuidv4();
		const staffWithoutPhone = await Staff.create({
			_id: tempStaffId,
			tenantId: context.hospitalId,
			userId: tempUserId,
			employeeId: `EMP-TEMP-${Date.now()}`,
			firstName: "Temp",
			lastName: "Staff",
			phone: "", // Empty phone
			departmentId: departmentId,
			roles: [roleId],
			specialization: "General Practice",
			shift: "EVENING",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		expect(staffWithoutPhone).toBeDefined();
		expect(staffWithoutPhone.phone).toBe("");

		// Clean up
		await Staff.deleteOne({ _id: tempStaffId });
		await User.deleteOne({ _id: tempUserId });
	});
});
