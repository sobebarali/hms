import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/vitals - Record vitals success", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	const createdVitalsIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["VITALS:CREATE", "VITALS:READ", "PATIENT:CREATE"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a patient for vitals recording
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "Vitals",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-vitals-${context.uniqueId}`,
			email: `vitals-patient-${context.uniqueId}@test.com`,
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
	}, 30000);

	afterAll(async () => {
		// Clean up created vitals
		for (const id of createdVitalsIds) {
			await Vitals.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("records vitals with all parameters successfully", async () => {
		const payload = {
			patientId,
			temperature: { value: 36.5, unit: "CELSIUS" },
			bloodPressure: { systolic: 120, diastolic: 80 },
			heartRate: 72,
			respiratoryRate: 16,
			oxygenSaturation: 98,
			weight: { value: 70, unit: "KG" },
			height: { value: 175, unit: "CM" },
			bloodGlucose: { value: 90, unit: "MG_DL", timing: "FASTING" },
			painLevel: 2,
			notes: "Patient appears healthy",
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("id");
		expect(response.body.patientId).toBe(patientId);
		expect(response.body.vitals.temperature.value).toBe(36.5);
		expect(response.body.vitals.temperature.unit).toBe("CELSIUS");
		expect(response.body.vitals.bloodPressure.systolic).toBe(120);
		expect(response.body.vitals.bloodPressure.diastolic).toBe(80);
		expect(response.body.vitals.heartRate).toBe(72);
		expect(response.body.vitals.respiratoryRate).toBe(16);
		expect(response.body.vitals.oxygenSaturation).toBe(98);
		expect(response.body.vitals.weight.value).toBe(70);
		expect(response.body.vitals.height.value).toBe(175);
		expect(response.body.vitals.bloodGlucose.value).toBe(90);
		expect(response.body.vitals.painLevel).toBe(2);
		expect(response.body.notes).toBe("Patient appears healthy");
		expect(response.body.bmi).toBeDefined();
		expect(response.body.bmi).toBeCloseTo(22.9, 1);
		expect(response.body.recordedBy).toHaveProperty("id");
		expect(response.body.recordedBy).toHaveProperty("firstName");
		expect(response.body.recordedBy).toHaveProperty("lastName");
		expect(response.body).toHaveProperty("recordedAt");
		expect(response.body.alerts).toEqual([]);

		createdVitalsIds.push(response.body.id);
	});

	it("records vitals with minimal parameters (temperature only)", async () => {
		const payload = {
			patientId,
			temperature: { value: 37.0, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("id");
		expect(response.body.patientId).toBe(patientId);
		expect(response.body.vitals.temperature.value).toBe(37.0);
		expect(response.body.vitals.bloodPressure).toBeUndefined();
		expect(response.body.vitals.heartRate).toBeUndefined();
		expect(response.body.bmi).toBeUndefined();

		createdVitalsIds.push(response.body.id);
	});

	it("records vitals with heart rate only", async () => {
		const payload = {
			patientId,
			heartRate: 80,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.vitals.heartRate).toBe(80);

		createdVitalsIds.push(response.body.id);
	});

	it("records vitals with blood pressure only", async () => {
		const payload = {
			patientId,
			bloodPressure: { systolic: 118, diastolic: 78 },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.vitals.bloodPressure.systolic).toBe(118);
		expect(response.body.vitals.bloodPressure.diastolic).toBe(78);

		createdVitalsIds.push(response.body.id);
	});

	it("calculates BMI correctly when weight and height provided", async () => {
		const payload = {
			patientId,
			weight: { value: 80, unit: "KG" },
			height: { value: 180, unit: "CM" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		// BMI = 80 / (1.8 * 1.8) = 24.69
		expect(response.body.bmi).toBeCloseTo(24.7, 1);

		createdVitalsIds.push(response.body.id);
	});

	it("records vitals with Fahrenheit temperature", async () => {
		const payload = {
			patientId,
			temperature: { value: 98.6, unit: "FAHRENHEIT" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.vitals.temperature.value).toBe(98.6);
		expect(response.body.vitals.temperature.unit).toBe("FAHRENHEIT");

		createdVitalsIds.push(response.body.id);
	});

	it("records vitals with LB weight and IN height", async () => {
		const payload = {
			patientId,
			weight: { value: 154, unit: "LB" },
			height: { value: 70, unit: "IN" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.vitals.weight.value).toBe(154);
		expect(response.body.vitals.weight.unit).toBe("LB");
		expect(response.body.vitals.height.value).toBe(70);
		expect(response.body.vitals.height.unit).toBe("IN");
		expect(response.body.bmi).toBeDefined();

		createdVitalsIds.push(response.body.id);
	});

	it("records vitals with blood glucose RANDOM timing", async () => {
		const payload = {
			patientId,
			bloodGlucose: { value: 110, unit: "MG_DL", timing: "RANDOM" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.vitals.bloodGlucose.timing).toBe("RANDOM");

		createdVitalsIds.push(response.body.id);
	});

	it("records vitals with blood glucose POSTPRANDIAL timing", async () => {
		const payload = {
			patientId,
			bloodGlucose: { value: 130, unit: "MG_DL", timing: "POSTPRANDIAL" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.vitals.bloodGlucose.timing).toBe("POSTPRANDIAL");

		createdVitalsIds.push(response.body.id);
	});

	it("records vitals with MMOL_L blood glucose unit", async () => {
		const payload = {
			patientId,
			bloodGlucose: { value: 5.5, unit: "MMOL_L", timing: "FASTING" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.vitals.bloodGlucose.unit).toBe("MMOL_L");

		createdVitalsIds.push(response.body.id);
	});
});
