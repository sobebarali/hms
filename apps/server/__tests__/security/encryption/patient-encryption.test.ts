import { Patient } from "@hms/db";
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

describe("Patient Model - Field Encryption", () => {
	let context: AuthTestContext;
	let encContext: EncryptionTestContext;
	let patientId: string;

	beforeAll(async () => {
		// Setup encryption key for tests
		encContext = setupEncryptionTestKey();

		// Create test context
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["PATIENT:CREATE", "PATIENT:READ"],
			createStaff: true,
		});
	});

	afterAll(async () => {
		// Clean up patient
		if (patientId) {
			await Patient.deleteOne({ _id: patientId });
		}

		// Clean up context
		await context.cleanup();

		// Restore original encryption key
		encContext.restoreKey();
	});

	it("should encrypt PHI fields (firstName, lastName, phone, email) at rest", async () => {
		// Create patient with PHI data
		patientId = uuidv4();
		const patientData = {
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `PAT-${Date.now()}`,
			firstName: "John",
			lastName: "Doe",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: "+1234567890",
			email: "john.doe@test.com",
			address: {
				street: "123 Main St",
				city: "Test City",
				state: "TS",
				postalCode: "12345",
				country: "USA",
			},
			emergencyContact: {
				name: "Jane Doe",
				relationship: "Spouse",
				phone: "+0987654321",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await Patient.create(patientData);

		// Get raw database values (bypassing Mongoose decryption)
		const rawFirstName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"firstName",
		);
		const rawLastName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"lastName",
		);
		const rawPhone = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"phone",
		);
		const rawEmail = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"email",
		);

		// Verify all PHI fields are encrypted with "enc:" prefix
		expect(rawFirstName).toMatch(/^enc:/);
		expect(rawLastName).toMatch(/^enc:/);
		expect(rawPhone).toMatch(/^enc:/);
		expect(rawEmail).toMatch(/^enc:/);
	});

	it("should decrypt PHI fields when retrieved via Mongoose", async () => {
		// Retrieve patient via Mongoose (should auto-decrypt)
		const patient = await Patient.findById(patientId);

		expect(patient).toBeDefined();
		expect(patient?.firstName).toBe("John");
		expect(patient?.lastName).toBe("Doe");
		expect(patient?.phone).toBe("+1234567890");
		expect(patient?.email).toBe("john.doe@test.com");

		// Verify fields are decrypted (no "enc:" prefix)
		expect(patient?.firstName).not.toMatch(/^enc:/);
		expect(patient?.lastName).not.toMatch(/^enc:/);
		expect(patient?.phone).not.toMatch(/^enc:/);
		expect(patient?.email).not.toMatch(/^enc:/);
	});

	it("should encrypt address sub-fields (street, city, state, postalCode, country)", async () => {
		// Get raw address values from database
		const rawDoc = await getRawDocumentFromDb("patient", patientId);

		expect(rawDoc).toBeDefined();
		expect(rawDoc?.address).toBeDefined();

		const address = rawDoc?.address as Record<string, unknown>;

		// Verify all address fields are encrypted
		expect(address.street).toMatch(/^enc:/);
		expect(address.city).toMatch(/^enc:/);
		expect(address.state).toMatch(/^enc:/);
		expect(address.postalCode).toMatch(/^enc:/);
		expect(address.country).toMatch(/^enc:/);
	});

	it("should decrypt address sub-fields when retrieved", async () => {
		const patient = await Patient.findById(patientId);

		expect(patient?.address).toBeDefined();
		expect(patient?.address?.street).toBe("123 Main St");
		expect(patient?.address?.city).toBe("Test City");
		expect(patient?.address?.state).toBe("TS");
		expect(patient?.address?.postalCode).toBe("12345");
		expect(patient?.address?.country).toBe("USA");
	});

	it("should encrypt emergency contact fields (name, phone, relationship)", async () => {
		const rawDoc = await getRawDocumentFromDb("patient", patientId);

		expect(rawDoc).toBeDefined();
		expect(rawDoc?.emergencyContact).toBeDefined();

		const emergencyContact = rawDoc?.emergencyContact as Record<
			string,
			unknown
		>;

		// Verify emergency contact fields are encrypted
		expect(emergencyContact.name).toMatch(/^enc:/);
		expect(emergencyContact.phone).toMatch(/^enc:/);
		expect(emergencyContact.relationship).toMatch(/^enc:/);
	});

	it("should decrypt emergency contact fields when retrieved", async () => {
		const patient = await Patient.findById(patientId);

		expect(patient?.emergencyContact).toBeDefined();
		expect(patient?.emergencyContact?.name).toBe("Jane Doe");
		expect(patient?.emergencyContact?.phone).toBe("+0987654321");
		expect(patient?.emergencyContact?.relationship).toBe("Spouse");
	});

	it("should re-encrypt modified fields on update", async () => {
		// Update patient firstName
		await Patient.findByIdAndUpdate(patientId, {
			firstName: "Jane",
		});

		// Get raw value after update
		const rawFirstName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"firstName",
		);

		// Verify it's still encrypted
		expect(rawFirstName).toMatch(/^enc:/);

		// Verify decrypted value is updated
		const patient = await Patient.findById(patientId);
		expect(patient?.firstName).toBe("Jane");
	});

	it("should keep non-encrypted fields unchanged", async () => {
		const patient = await Patient.findById(patientId);

		// Non-encrypted fields should be plaintext
		expect(patient?.patientId).toBe(patient?.patientId);
		expect(patient?.gender).toBe("MALE");
		expect(patient?.patientType).toBe("OPD");
		expect(patient?.status).toBe("ACTIVE");

		// Verify they don't have "enc:" prefix
		expect(patient?.patientId).not.toMatch(/^enc:/);
		expect(patient?.gender).not.toMatch(/^enc:/);
	});

	it("should use helper functions to verify encryption", async () => {
		const rawDoc = await getRawDocumentFromDb("patient", patientId);

		// Test verifyFieldEncrypted helper
		expect(verifyFieldEncrypted(rawDoc, "firstName")).toBe(true);
		expect(verifyFieldEncrypted(rawDoc, "lastName")).toBe(true);
		expect(verifyFieldEncrypted(rawDoc, "address.street")).toBe(true);
		expect(verifyFieldEncrypted(rawDoc, "emergencyContact.name")).toBe(true);

		// Non-encrypted fields should return false
		expect(verifyFieldEncrypted(rawDoc, "patientId")).toBe(false);
		expect(verifyFieldEncrypted(rawDoc, "gender")).toBe(false);
	});

	it("should use helper functions to verify decryption", async () => {
		const patient = await Patient.findById(patientId);

		// Test verifyFieldDecrypted helper
		expect(verifyFieldDecrypted(patient, "firstName", "Jane")).toBe(true);
		expect(verifyFieldDecrypted(patient, "lastName", "Doe")).toBe(true);
		expect(verifyFieldDecrypted(patient, "phone", "+1234567890")).toBe(true);
		expect(verifyFieldDecrypted(patient, "email", "john.doe@test.com")).toBe(
			true,
		);
		expect(verifyFieldDecrypted(patient, "address.street", "123 Main St")).toBe(
			true,
		);
		expect(
			verifyFieldDecrypted(patient, "emergencyContact.name", "Jane Doe"),
		).toBe(true);
	});
});
