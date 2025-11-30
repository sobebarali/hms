import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/vitals/patient/:patientId/latest - Latest vitals success", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	const createdVitalsIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["VITALS:CREATE", "VITALS:READ"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a patient
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-latest-${context.uniqueId}`,
			firstName: "Latest",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-latest-${context.uniqueId}`,
			address: {
				street: "123 Test St",
				city: "Test City",
				state: "TS",
				postalCode: "12345",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Spouse",
				phone: "+1-555-0000",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create vitals records at different times to test latest retrieval
		// First record - older
		const firstResponse = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				temperature: { value: 36.5, unit: "CELSIUS" },
				heartRate: 70,
				bloodPressure: { systolic: 110, diastolic: 70 },
				notes: "First vitals record",
			});
		createdVitalsIds.push(firstResponse.body.id);

		// Wait a bit to ensure different timestamps
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Second record - newer with different vitals
		const secondResponse = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				temperature: { value: 37.0, unit: "CELSIUS" },
				respiratoryRate: 16,
				oxygenSaturation: 98,
				notes: "Second vitals record",
			});
		createdVitalsIds.push(secondResponse.body.id);

		// Wait a bit
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Third record - latest with more vitals
		const thirdResponse = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				heartRate: 75,
				bloodPressure: { systolic: 120, diastolic: 80 },
				weight: { value: 70, unit: "KG" },
				height: { value: 175, unit: "CM" },
				painLevel: 2,
				notes: "Third vitals record",
			});
		createdVitalsIds.push(thirdResponse.body.id);
	}, 30000);

	afterAll(async () => {
		for (const id of createdVitalsIds) {
			await Vitals.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("returns latest vitals for patient successfully", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/latest`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("patientId", patientId);
	});

	it("returns patientId in response", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/latest`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.patientId).toBe(patientId);
	});

	it("returns latest temperature with timestamp", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/latest`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.temperature).toBeDefined();
		expect(response.body.temperature.value).toBe(37.0); // From second record (latest with temp)
		expect(response.body.temperature.unit).toBe("CELSIUS");
		expect(response.body.temperature.recordedAt).toBeDefined();
	});

	it("returns latest heart rate with timestamp", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/latest`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.heartRate).toBeDefined();
		expect(response.body.heartRate.value).toBe(75); // From third record (latest with heart rate)
		expect(response.body.heartRate.recordedAt).toBeDefined();
	});

	it("returns latest blood pressure with timestamp", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/latest`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.bloodPressure).toBeDefined();
		expect(response.body.bloodPressure.systolic).toBe(120); // From third record
		expect(response.body.bloodPressure.diastolic).toBe(80);
		expect(response.body.bloodPressure.recordedAt).toBeDefined();
	});

	it("returns latest respiratory rate with timestamp", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/latest`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.respiratoryRate).toBeDefined();
		expect(response.body.respiratoryRate.value).toBe(16); // From second record
		expect(response.body.respiratoryRate.recordedAt).toBeDefined();
	});

	it("returns latest oxygen saturation with timestamp", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/latest`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.oxygenSaturation).toBeDefined();
		expect(response.body.oxygenSaturation.value).toBe(98); // From second record
		expect(response.body.oxygenSaturation.recordedAt).toBeDefined();
	});

	it("returns latest weight with timestamp and unit", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/latest`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.weight).toBeDefined();
		expect(response.body.weight.value).toBe(70); // From third record
		expect(response.body.weight.unit).toBe("KG");
		expect(response.body.weight.recordedAt).toBeDefined();
	});

	it("returns latest height with timestamp and unit", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/latest`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.height).toBeDefined();
		expect(response.body.height.value).toBe(175); // From third record
		expect(response.body.height.unit).toBe("CM");
		expect(response.body.height.recordedAt).toBeDefined();
	});

	it("returns latest pain level with timestamp", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/latest`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.painLevel).toBeDefined();
		expect(response.body.painLevel.value).toBe(2); // From third record
		expect(response.body.painLevel.recordedAt).toBeDefined();
	});

	it("returns empty response for patient with no vitals", async () => {
		// Create a new patient without vitals
		const emptyPatientId = uuidv4();
		await Patient.create({
			_id: emptyPatientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-empty-${context.uniqueId}`,
			firstName: "Empty",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "FEMALE",
			phone: `+1-empty-${context.uniqueId}`,
			address: {
				street: "456 Empty St",
				city: "Empty City",
				state: "EM",
				postalCode: "00000",
				country: "USA",
			},
			emergencyContact: {
				name: "Contact",
				relationship: "Parent",
				phone: "+1-555-1111",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		try {
			const response = await request(app)
				.get(`/api/vitals/patient/${emptyPatientId}/latest`)
				.set("Authorization", `Bearer ${accessToken}`);

			expect(response.status).toBe(200);
			expect(response.body.patientId).toBe(emptyPatientId);
			// No vitals data should be present
			expect(response.body.temperature).toBeUndefined();
			expect(response.body.heartRate).toBeUndefined();
			expect(response.body.bloodPressure).toBeUndefined();
		} finally {
			await Patient.deleteOne({ _id: emptyPatientId });
		}
	});
});
