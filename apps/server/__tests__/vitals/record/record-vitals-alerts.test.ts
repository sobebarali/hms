import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/vitals - Alerts generation", () => {
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

		// Create a patient for alert tests
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-alert-${context.uniqueId}`,
			firstName: "Alert",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-alert-${context.uniqueId}`,
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
		for (const id of createdVitalsIds) {
			await Vitals.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("generates hypothermia alert for low temperature", async () => {
		const payload = {
			patientId,
			temperature: { value: 34.0, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("HYPOTHERMIA");
		expect(response.body.alerts[0].parameter).toBe("temperature");
		expect(response.body.alerts[0].value).toBe(34.0);
		expect(response.body.alerts[0]).toHaveProperty("normalRange");
		expect(response.body.alerts[0]).toHaveProperty("severity");

		createdVitalsIds.push(response.body.id);
	});

	it("generates low grade fever alert for slightly elevated temperature", async () => {
		const payload = {
			patientId,
			temperature: { value: 38.0, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("LOW_GRADE_FEVER");
		expect(response.body.alerts[0].parameter).toBe("temperature");

		createdVitalsIds.push(response.body.id);
	});

	it("generates moderate fever alert for moderately elevated temperature", async () => {
		const payload = {
			patientId,
			temperature: { value: 39.0, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("MODERATE_FEVER");

		createdVitalsIds.push(response.body.id);
	});

	it("generates high fever alert for high temperature", async () => {
		const payload = {
			patientId,
			temperature: { value: 40.0, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("HIGH_FEVER");

		createdVitalsIds.push(response.body.id);
	});

	it("generates hypotension alert for low blood pressure", async () => {
		const payload = {
			patientId,
			bloodPressure: { systolic: 85, diastolic: 55 },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("HYPOTENSION");
		expect(response.body.alerts[0].parameter).toBe("bloodPressure");

		createdVitalsIds.push(response.body.id);
	});

	it("generates elevated BP alert for slightly high blood pressure", async () => {
		const payload = {
			patientId,
			bloodPressure: { systolic: 125, diastolic: 82 },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("ELEVATED_BP");

		createdVitalsIds.push(response.body.id);
	});

	it("generates hypertension stage 1 alert", async () => {
		const payload = {
			patientId,
			bloodPressure: { systolic: 145, diastolic: 92 },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("HYPERTENSION_STAGE_1");

		createdVitalsIds.push(response.body.id);
	});

	it("generates hypertension stage 2 alert", async () => {
		const payload = {
			patientId,
			bloodPressure: { systolic: 165, diastolic: 105 },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("HYPERTENSION_STAGE_2");
		expect(response.body.alerts[0].severity).toBe("HIGH");

		createdVitalsIds.push(response.body.id);
	});

	it("generates bradycardia alert for low heart rate", async () => {
		const payload = {
			patientId,
			heartRate: 50,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("BRADYCARDIA");
		expect(response.body.alerts[0].parameter).toBe("heartRate");

		createdVitalsIds.push(response.body.id);
	});

	it("generates tachycardia alert for high heart rate", async () => {
		const payload = {
			patientId,
			heartRate: 120,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("TACHYCARDIA");
		expect(response.body.alerts[0].parameter).toBe("heartRate");

		createdVitalsIds.push(response.body.id);
	});

	it("generates low respiratory rate alert", async () => {
		const payload = {
			patientId,
			respiratoryRate: 10,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("LOW_RESPIRATORY_RATE");
		expect(response.body.alerts[0].parameter).toBe("respiratoryRate");

		createdVitalsIds.push(response.body.id);
	});

	it("generates high respiratory rate alert", async () => {
		const payload = {
			patientId,
			respiratoryRate: 25,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("HIGH_RESPIRATORY_RATE");

		createdVitalsIds.push(response.body.id);
	});

	it("generates low oxygen saturation alert", async () => {
		const payload = {
			patientId,
			oxygenSaturation: 93,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("LOW_OXYGEN_SATURATION");
		expect(response.body.alerts[0].severity).toBe("MEDIUM");

		createdVitalsIds.push(response.body.id);
	});

	it("generates critical hypoxemia alert for very low oxygen saturation", async () => {
		const payload = {
			patientId,
			oxygenSaturation: 88,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("CRITICAL_HYPOXEMIA");
		expect(response.body.alerts[0].severity).toBe("CRITICAL");

		createdVitalsIds.push(response.body.id);
	});

	it("generates hypoglycemia alert for low blood glucose", async () => {
		const payload = {
			patientId,
			bloodGlucose: { value: 60, unit: "MG_DL", timing: "FASTING" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("HYPOGLYCEMIA");
		expect(response.body.alerts[0].parameter).toBe("bloodGlucose");

		createdVitalsIds.push(response.body.id);
	});

	it("generates hyperglycemia alert for high blood glucose", async () => {
		const payload = {
			patientId,
			bloodGlucose: { value: 200, unit: "MG_DL", timing: "RANDOM" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toHaveLength(1);
		expect(response.body.alerts[0].type).toBe("HYPERGLYCEMIA");
		expect(response.body.alerts[0].parameter).toBe("bloodGlucose");

		createdVitalsIds.push(response.body.id);
	});

	it("generates multiple alerts when multiple vitals are abnormal", async () => {
		const payload = {
			patientId,
			temperature: { value: 40.0, unit: "CELSIUS" },
			heartRate: 45,
			oxygenSaturation: 89,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts.length).toBeGreaterThanOrEqual(3);

		const alertTypes = response.body.alerts.map(
			(a: { type: string }) => a.type,
		);
		expect(alertTypes).toContain("HIGH_FEVER");
		expect(alertTypes).toContain("BRADYCARDIA");
		expect(alertTypes).toContain("CRITICAL_HYPOXEMIA");

		createdVitalsIds.push(response.body.id);
	});

	it("does not generate alerts for normal vitals", async () => {
		const payload = {
			patientId,
			temperature: { value: 36.8, unit: "CELSIUS" },
			bloodPressure: { systolic: 118, diastolic: 78 },
			heartRate: 72,
			respiratoryRate: 16,
			oxygenSaturation: 98,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body.alerts).toEqual([]);

		createdVitalsIds.push(response.body.id);
	});
});
