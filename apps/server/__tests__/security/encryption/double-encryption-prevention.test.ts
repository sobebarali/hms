import { Patient } from "@hms/db";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthTestContext } from "../../helpers/auth-test-context";
import { createAuthTestContext } from "../../helpers/auth-test-context";
import {
	type EncryptionTestContext,
	getEncryptedValueFromDb,
	setupEncryptionTestKey,
} from "../../helpers/encryption-test-helper";

describe("Double Encryption Prevention", () => {
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

	it("should not double-encrypt values that already have 'enc:' prefix", async () => {
		// Create patient
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `PAT-${Date.now()}`,
			firstName: "Test",
			lastName: "User",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: "+1234567890",
			address: {
				street: "123 Main St",
				city: "Test City",
				state: "TS",
				postalCode: "12345",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Friend",
				phone: "+0987654321",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Get initial encrypted value
		const initialEncryptedFirstName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"firstName",
		);
		expect(initialEncryptedFirstName).toMatch(/^enc:/);

		// Save the patient again (should not modify encrypted values)
		const patient = await Patient.findById(patientId);
		await patient?.save();

		// Get encrypted value after save
		const afterSaveEncryptedFirstName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"firstName",
		);

		// Should still be encrypted
		expect(afterSaveEncryptedFirstName).toMatch(/^enc:/);

		// Should not have nested "enc:enc:" prefix
		expect(afterSaveEncryptedFirstName).not.toMatch(/^enc:enc:/);

		// Verify decrypted value is still correct
		const patientAfterSave = await Patient.findById(patientId);
		expect(patientAfterSave?.firstName).toBe("Test");
	});

	it("should not double-encrypt on multiple saves", async () => {
		// Save multiple times without modifying fields
		const patient = await Patient.findById(patientId);
		await patient?.save();
		await patient?.save();
		await patient?.save();

		// Get encrypted value after multiple saves
		const afterMultipleSaves = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"phone",
		);

		// Should still be encrypted
		expect(afterMultipleSaves).toMatch(/^enc:/);
		expect(afterMultipleSaves).not.toMatch(/^enc:enc:/);

		// Verify decrypted value is still correct
		const patientAfterSaves = await Patient.findById(patientId);
		expect(patientAfterSaves?.phone).toBe("+1234567890");
	});

	it("should not double-encrypt nested fields on multiple saves", async () => {
		// Save multiple times without modifying fields
		const patient = await Patient.findById(patientId);
		await patient?.save();
		await patient?.save();

		// Get encrypted value after saves
		const afterSavesStreet = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"address.street",
		);

		// Should still be encrypted
		expect(afterSavesStreet).toMatch(/^enc:/);
		expect(afterSavesStreet).not.toMatch(/^enc:enc:/);

		// Verify decrypted value is still correct
		const patientAfterSaves = await Patient.findById(patientId);
		expect(patientAfterSaves?.address?.street).toBe("123 Main St");
	});

	it("should handle updates without re-encrypting unchanged fields", async () => {
		// Get initial encrypted values
		const initialFirstName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"firstName",
		);
		const initialLastName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"lastName",
		);

		// Update only patientType (non-encrypted field)
		await Patient.findByIdAndUpdate(patientId, {
			patientType: "IPD",
		});

		// Get encrypted values after update
		const afterUpdateFirstName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"firstName",
		);
		const afterUpdateLastName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"lastName",
		);

		// Encrypted fields should remain unchanged
		expect(afterUpdateFirstName).toBe(initialFirstName);
		expect(afterUpdateLastName).toBe(initialLastName);

		// Verify patient type was updated
		const patient = await Patient.findById(patientId);
		expect(patient?.patientType).toBe("IPD");
	});

	it("should only re-encrypt modified fields during updates", async () => {
		// Get initial encrypted values
		const initialFirstName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"firstName",
		);
		const initialLastName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"lastName",
		);

		// Update only firstName
		await Patient.findByIdAndUpdate(patientId, {
			firstName: "Updated",
		});

		// Get encrypted values after update
		const afterUpdateFirstName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"firstName",
		);
		const afterUpdateLastName = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"lastName",
		);

		// firstName should be re-encrypted (different value)
		expect(afterUpdateFirstName).not.toBe(initialFirstName);
		expect(afterUpdateFirstName).toMatch(/^enc:/);

		// lastName should remain unchanged (not re-encrypted)
		expect(afterUpdateLastName).toBe(initialLastName);

		// Verify decrypted values
		const patient = await Patient.findById(patientId);
		expect(patient?.firstName).toBe("Updated");
		expect(patient?.lastName).toBe("User");
	});

	it("should handle $set operator updates without double encryption", async () => {
		// Get initial encrypted email
		const initialEmail = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"email",
		);

		// Update using $set operator
		await Patient.findByIdAndUpdate(patientId, {
			$set: {
				email: "newemail@test.com",
			},
		});

		// Get encrypted value after update
		const afterUpdate = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"email",
		);

		// Should be encrypted (but different from initial)
		expect(afterUpdate).toMatch(/^enc:/);
		expect(afterUpdate).not.toBe(initialEmail);
		expect(afterUpdate).not.toMatch(/^enc:enc:/);

		// Verify decrypted value
		const patient = await Patient.findById(patientId);
		expect(patient?.email).toBe("newemail@test.com");
	});

	it("should handle nested field updates without double encryption", async () => {
		// Update nested field using find + modify + save pattern
		const patient = await Patient.findById(patientId);
		if (patient?.address) {
			patient.address.city = "New City";
			await patient.save();
		}

		// Get encrypted value after update
		const afterUpdate = await getEncryptedValueFromDb(
			"patient",
			patientId,
			"address.city",
		);

		// Should be encrypted
		expect(afterUpdate).toMatch(/^enc:/);
		expect(afterUpdate).not.toMatch(/^enc:enc:/);

		// Verify decrypted value
		const updatedPatient = await Patient.findById(patientId);
		expect(updatedPatient?.address?.city).toBe("New City");
	});

	it("should preserve correct decrypted values after multiple operations", async () => {
		// Perform multiple operations
		await Patient.findByIdAndUpdate(patientId, { firstName: "Alice" });
		await Patient.findByIdAndUpdate(patientId, { lastName: "Smith" });
		await Patient.findByIdAndUpdate(patientId, { phone: "+1111111111" });

		// Retrieve and verify decrypted values
		const patient = await Patient.findById(patientId);
		expect(patient?.firstName).toBe("Alice");
		expect(patient?.lastName).toBe("Smith");
		expect(patient?.phone).toBe("+1111111111");

		// All should be decrypted (no "enc:" prefix)
		expect(patient?.firstName).not.toMatch(/^enc:/);
		expect(patient?.lastName).not.toMatch(/^enc:/);
		expect(patient?.phone).not.toMatch(/^enc:/);

		// Verify raw values are still encrypted
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

		expect(rawFirstName).toMatch(/^enc:/);
		expect(rawLastName).toMatch(/^enc:/);
		expect(rawPhone).toMatch(/^enc:/);
	});
});
