import { Patient, Vitals } from "@hms/db";
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

describe("Vitals Model - Field Encryption", () => {
	let context: AuthTestContext;
	let encContext: EncryptionTestContext;
	let vitalsId: string;
	let patientId: string;

	beforeAll(async () => {
		// Setup encryption key for tests
		encContext = setupEncryptionTestKey();

		// Create test context
		context = await createAuthTestContext({
			roleName: "NURSE",
			rolePermissions: ["VITALS:CREATE", "VITALS:READ", "PATIENT:CREATE"],
			createStaff: true,
		});

		// Create patient for vitals
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `PAT-${Date.now()}`,
			firstName: "John",
			lastName: "Doe",
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
				name: "Jane Doe",
				relationship: "Spouse",
				phone: "+0987654321",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	});

	afterAll(async () => {
		// Clean up vitals
		if (vitalsId) {
			await Vitals.deleteOne({ _id: vitalsId });
		}

		// Clean up patient
		if (patientId) {
			await Patient.deleteOne({ _id: patientId });
		}

		// Clean up context
		await context.cleanup();

		// Restore original encryption key
		encContext.restoreKey();
	});

	it("should encrypt notes field at rest", async () => {
		// Create vitals with notes using updated schema
		vitalsId = uuidv4();
		const vitalsData = {
			_id: vitalsId,
			tenantId: context.hospitalId,
			patientId: patientId,
			recordedBy: context.staffId,
			temperature: {
				value: 98.6,
				unit: "FAHRENHEIT",
			},
			bloodPressure: {
				systolic: 120,
				diastolic: 80,
			},
			heartRate: 72,
			respiratoryRate: 16,
			oxygenSaturation: 98,
			weight: {
				value: 70,
				unit: "KG",
			},
			height: {
				value: 175,
				unit: "CM",
			},
			notes: "Patient feeling well, vitals are stable",
			recordedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await Vitals.create(vitalsData);

		// Get raw database value (bypassing Mongoose decryption)
		const rawNotes = await getEncryptedValueFromDb("vitals", vitalsId, "notes");

		// Verify notes is encrypted with "enc:" prefix
		expect(rawNotes).toMatch(/^enc:/);
	});

	it("should decrypt notes when retrieved via Mongoose", async () => {
		// Retrieve vitals via Mongoose (should auto-decrypt)
		const vitals = await Vitals.findById(vitalsId);

		expect(vitals).toBeDefined();
		expect(vitals?.notes).toBe("Patient feeling well, vitals are stable");

		// Verify notes is decrypted (no "enc:" prefix)
		expect(vitals?.notes).not.toMatch(/^enc:/);
	});

	it("should encrypt correctionReason field at rest", async () => {
		// Update vitals with correction
		await Vitals.findByIdAndUpdate(vitalsId, {
			correctionReason: "Initial reading was incorrect due to equipment error",
		});

		// Get raw database value
		const rawCorrectionReason = await getEncryptedValueFromDb(
			"vitals",
			vitalsId,
			"correctionReason",
		);

		// Verify correctionReason is encrypted
		expect(rawCorrectionReason).toMatch(/^enc:/);
	});

	it("should decrypt correctionReason when retrieved via Mongoose", async () => {
		// Retrieve vitals via Mongoose
		const vitals = await Vitals.findById(vitalsId);

		expect(vitals).toBeDefined();
		expect(vitals?.correctionReason).toBe(
			"Initial reading was incorrect due to equipment error",
		);

		// Verify correctionReason is decrypted
		expect(vitals?.correctionReason).not.toMatch(/^enc:/);
	});

	it("should re-encrypt notes on update", async () => {
		// Update notes
		await Vitals.findByIdAndUpdate(vitalsId, {
			notes: "Updated notes: Patient reported slight headache",
		});

		// Get raw value after update
		const rawNotes = await getEncryptedValueFromDb("vitals", vitalsId, "notes");

		// Verify it's still encrypted
		expect(rawNotes).toMatch(/^enc:/);

		// Verify decrypted value is updated
		const vitals = await Vitals.findById(vitalsId);
		expect(vitals?.notes).toBe(
			"Updated notes: Patient reported slight headache",
		);
	});

	it("should keep vital readings unencrypted", async () => {
		const vitals = await Vitals.findById(vitalsId);

		// Vital readings should be plaintext
		expect(vitals?.temperature?.value).toBe(98.6);
		expect(vitals?.temperature?.unit).toBe("FAHRENHEIT");
		expect(vitals?.bloodPressure?.systolic).toBe(120);
		expect(vitals?.bloodPressure?.diastolic).toBe(80);
		expect(vitals?.heartRate).toBe(72);
		expect(vitals?.respiratoryRate).toBe(16);
		expect(vitals?.oxygenSaturation).toBe(98);
		expect(vitals?.weight?.value).toBe(70);
		expect(vitals?.weight?.unit).toBe("KG");
		expect(vitals?.height?.value).toBe(175);
		expect(vitals?.height?.unit).toBe("CM");
	});

	it("should verify encryption in raw database", async () => {
		const rawDoc = await getRawDocumentFromDb("vitals", vitalsId);

		// Test verifyFieldEncrypted helper
		expect(verifyFieldEncrypted(rawDoc, "notes")).toBe(true);
		expect(verifyFieldEncrypted(rawDoc, "correctionReason")).toBe(true);

		// Non-encrypted fields should return false
		expect(verifyFieldEncrypted(rawDoc, "heartRate")).toBe(false);
		expect(verifyFieldEncrypted(rawDoc, "respiratoryRate")).toBe(false);
	});

	it("should verify decryption in retrieved document", async () => {
		const vitals = await Vitals.findById(vitalsId);

		// Test verifyFieldDecrypted helper
		expect(
			verifyFieldDecrypted(
				vitals,
				"notes",
				"Updated notes: Patient reported slight headache",
			),
		).toBe(true);
		expect(
			verifyFieldDecrypted(
				vitals,
				"correctionReason",
				"Initial reading was incorrect due to equipment error",
			),
		).toBe(true);
	});

	it("should handle empty notes gracefully", async () => {
		// Create vitals without notes
		const tempVitalsId = uuidv4();
		const vitalsWithoutNotes = await Vitals.create({
			_id: tempVitalsId,
			tenantId: context.hospitalId,
			patientId: patientId,
			recordedBy: context.staffId,
			temperature: {
				value: 98.6,
				unit: "FAHRENHEIT",
			},
			recordedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		expect(vitalsWithoutNotes).toBeDefined();
		expect(vitalsWithoutNotes.notes).toBeUndefined();

		// Clean up
		await Vitals.deleteOne({ _id: tempVitalsId });
	});

	it("should handle undefined correctionReason gracefully", async () => {
		// Create vitals without correction
		const tempVitalsId = uuidv4();
		const vitalsWithoutCorrection = await Vitals.create({
			_id: tempVitalsId,
			tenantId: context.hospitalId,
			patientId: patientId,
			recordedBy: context.staffId,
			temperature: {
				value: 97.5,
				unit: "FAHRENHEIT",
			},
			recordedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		expect(vitalsWithoutCorrection).toBeDefined();
		expect(vitalsWithoutCorrection.correctionReason).toBeUndefined();

		// Clean up
		await Vitals.deleteOne({ _id: tempVitalsId });
	});
});
