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

describe("Nested Fields - Encryption with Dot Notation", () => {
	let context: AuthTestContext;
	let encContext: EncryptionTestContext;
	let patientId: string;

	beforeAll(async () => {
		// Setup encryption key for tests
		encContext = setupEncryptionTestKey();

		// Create test context
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["PATIENT:CREATE", "PATIENT:READ", "PATIENT:UPDATE"],
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

	it("should encrypt all address sub-fields using dot notation", async () => {
		// Create patient with address
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `PAT-${Date.now()}`,
			firstName: "Alice",
			lastName: "Smith",
			dateOfBirth: new Date("1985-05-15"),
			gender: "FEMALE",
			phone: "+1555000111",
			email: "alice.smith@test.com",
			address: {
				street: "456 Oak Avenue",
				city: "Springfield",
				state: "IL",
				postalCode: "62701",
				country: "United States",
			},
			emergencyContact: {
				name: "Bob Smith",
				relationship: "Husband",
				phone: "+1555000222",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Get raw document from database
		const rawDoc = await getRawDocumentFromDb("patient", patientId);
		const address = rawDoc?.address as Record<string, unknown>;

		// Verify each address field is encrypted individually
		expect(address.street).toMatch(/^enc:/);
		expect(address.city).toMatch(/^enc:/);
		expect(address.state).toMatch(/^enc:/);
		expect(address.postalCode).toMatch(/^enc:/);
		expect(address.country).toMatch(/^enc:/);
	});

	it("should decrypt all address sub-fields when retrieved", async () => {
		const patient = await Patient.findById(patientId);

		expect(patient?.address).toBeDefined();
		expect(patient?.address?.street).toBe("456 Oak Avenue");
		expect(patient?.address?.city).toBe("Springfield");
		expect(patient?.address?.state).toBe("IL");
		expect(patient?.address?.postalCode).toBe("62701");
		expect(patient?.address?.country).toBe("United States");

		// Verify no "enc:" prefix in decrypted values
		expect(patient?.address?.street).not.toMatch(/^enc:/);
		expect(patient?.address?.city).not.toMatch(/^enc:/);
	});

	it("should encrypt all emergency contact sub-fields using dot notation", async () => {
		const rawDoc = await getRawDocumentFromDb("patient", patientId);
		const emergencyContact = rawDoc?.emergencyContact as Record<
			string,
			unknown
		>;

		// Verify each emergency contact field is encrypted individually
		expect(emergencyContact.name).toMatch(/^enc:/);
		expect(emergencyContact.relationship).toMatch(/^enc:/);
		expect(emergencyContact.phone).toMatch(/^enc:/);
	});

	it("should decrypt all emergency contact sub-fields when retrieved", async () => {
		const patient = await Patient.findById(patientId);

		expect(patient?.emergencyContact).toBeDefined();
		expect(patient?.emergencyContact?.name).toBe("Bob Smith");
		expect(patient?.emergencyContact?.relationship).toBe("Husband");
		expect(patient?.emergencyContact?.phone).toBe("+1555000222");

		// Verify no "enc:" prefix in decrypted values
		expect(patient?.emergencyContact?.name).not.toMatch(/^enc:/);
		expect(patient?.emergencyContact?.relationship).not.toMatch(/^enc:/);
	});

	it("should handle partial updates to nested address fields", async () => {
		// Update via find + modify + save pattern (which works with encryption)
		const patient = await Patient.findById(patientId);
		if (patient?.address) {
			patient.address.street = "789 Elm Street";
			await patient.save();
		}

		// Verify decrypted value is updated
		const updatedPatient = await Patient.findById(patientId);
		expect(updatedPatient?.address?.street).toBe("789 Elm Street");

		// Verify other address fields remain unchanged
		expect(updatedPatient?.address?.city).toBe("Springfield");
		expect(updatedPatient?.address?.state).toBe("IL");

		// Verify street is encrypted in database
		const rawStreet = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"address.street",
		);
		expect(rawStreet).toMatch(/^enc:/);
	});

	it("should handle partial updates to nested emergency contact fields", async () => {
		// Update via find + modify + save pattern (which works with encryption)
		const patient = await Patient.findById(patientId);
		if (patient?.emergencyContact) {
			patient.emergencyContact.relationship = "Spouse";
			await patient.save();
		}

		// Verify decrypted value is updated
		const updatedPatient = await Patient.findById(patientId);
		expect(updatedPatient?.emergencyContact?.relationship).toBe("Spouse");

		// Verify other emergency contact fields remain unchanged
		expect(updatedPatient?.emergencyContact?.name).toBe("Bob Smith");
		expect(updatedPatient?.emergencyContact?.phone).toBe("+1555000222");

		// Verify relationship is encrypted in database
		const rawRelationship = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"emergencyContact.relationship",
		);
		expect(rawRelationship).toMatch(/^enc:/);
	});

	it("should verify nested field encryption using helpers", async () => {
		const rawDoc = await getRawDocumentFromDb("patient", patientId);

		// Test verifyFieldEncrypted helper with dot notation
		expect(verifyFieldEncrypted(rawDoc, "address.street")).toBe(true);
		expect(verifyFieldEncrypted(rawDoc, "address.city")).toBe(true);
		expect(verifyFieldEncrypted(rawDoc, "address.state")).toBe(true);
		expect(verifyFieldEncrypted(rawDoc, "address.postalCode")).toBe(true);
		expect(verifyFieldEncrypted(rawDoc, "address.country")).toBe(true);

		expect(verifyFieldEncrypted(rawDoc, "emergencyContact.name")).toBe(true);
		expect(verifyFieldEncrypted(rawDoc, "emergencyContact.phone")).toBe(true);
		expect(verifyFieldEncrypted(rawDoc, "emergencyContact.relationship")).toBe(
			true,
		);
	});

	it("should verify nested field decryption using helpers", async () => {
		const patient = await Patient.findById(patientId);

		// Test verifyFieldDecrypted helper with dot notation
		expect(
			verifyFieldDecrypted(patient, "address.street", "789 Elm Street"),
		).toBe(true);
		expect(verifyFieldDecrypted(patient, "address.city", "Springfield")).toBe(
			true,
		);
		expect(verifyFieldDecrypted(patient, "address.state", "IL")).toBe(true);
		expect(verifyFieldDecrypted(patient, "address.postalCode", "62701")).toBe(
			true,
		);
		expect(
			verifyFieldDecrypted(patient, "address.country", "United States"),
		).toBe(true);

		expect(
			verifyFieldDecrypted(patient, "emergencyContact.name", "Bob Smith"),
		).toBe(true);
		expect(
			verifyFieldDecrypted(patient, "emergencyContact.phone", "+1555000222"),
		).toBe(true);
		expect(
			verifyFieldDecrypted(patient, "emergencyContact.relationship", "Spouse"),
		).toBe(true);
	});

	it("should handle complete address object update", async () => {
		// Update entire address object using find + save
		const patient = await Patient.findById(patientId);
		if (patient) {
			patient.address = {
				street: "321 Pine Lane",
				city: "Chicago",
				state: "IL",
				postalCode: "60601",
				country: "USA",
			};
			await patient.save();
		}

		// Verify all fields are encrypted in database
		const rawDoc = await getRawDocumentFromDb("patient", patientId);
		const address = rawDoc?.address as Record<string, unknown>;

		expect(address.street).toMatch(/^enc:/);
		expect(address.city).toMatch(/^enc:/);
		expect(address.state).toMatch(/^enc:/);
		expect(address.postalCode).toMatch(/^enc:/);
		expect(address.country).toMatch(/^enc:/);

		// Verify decrypted values
		const updatedPatient = await Patient.findById(patientId);
		expect(updatedPatient?.address?.street).toBe("321 Pine Lane");
		expect(updatedPatient?.address?.city).toBe("Chicago");
		expect(updatedPatient?.address?.postalCode).toBe("60601");
	});

	it("should handle complete emergency contact object update", async () => {
		// Update entire emergency contact object using find + save
		const patient = await Patient.findById(patientId);
		if (patient) {
			patient.emergencyContact = {
				name: "Carol Smith",
				relationship: "Sister",
				phone: "+1555000333",
			};
			await patient.save();
		}

		// Verify all fields are encrypted in database
		const rawDoc = await getRawDocumentFromDb("patient", patientId);
		const emergencyContact = rawDoc?.emergencyContact as Record<
			string,
			unknown
		>;

		expect(emergencyContact.name).toMatch(/^enc:/);
		expect(emergencyContact.relationship).toMatch(/^enc:/);
		expect(emergencyContact.phone).toMatch(/^enc:/);

		// Verify decrypted values
		const updatedPatient = await Patient.findById(patientId);
		expect(updatedPatient?.emergencyContact?.name).toBe("Carol Smith");
		expect(updatedPatient?.emergencyContact?.relationship).toBe("Sister");
		expect(updatedPatient?.emergencyContact?.phone).toBe("+1555000333");
	});

	it("should use getEncryptedValueFromDb helper for nested fields", async () => {
		// Test getEncryptedValueFromDb with nested fields
		const rawStreet = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"address.street",
		);
		const rawCity = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"address.city",
		);
		const rawEmergencyName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"emergencyContact.name",
		);

		// All should have "enc:" prefix
		expect(rawStreet).toMatch(/^enc:/);
		expect(rawCity).toMatch(/^enc:/);
		expect(rawEmergencyName).toMatch(/^enc:/);
	});
});
