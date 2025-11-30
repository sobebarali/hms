import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/vitals/:id - Get vitals success", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let vitalsId: string;

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
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "GetById",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-getbyid-${context.uniqueId}`,
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

		// Create vitals for the patient via API
		const createResponse = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				temperature: { value: 36.5, unit: "CELSIUS" },
				bloodPressure: { systolic: 120, diastolic: 80 },
				heartRate: 72,
				respiratoryRate: 16,
				oxygenSaturation: 98,
				notes: "Test vitals for get-by-id",
			});

		vitalsId = createResponse.body.id;
	}, 30000);

	afterAll(async () => {
		await Vitals.deleteOne({ _id: vitalsId });
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("retrieves vitals record by ID successfully", async () => {
		const response = await request(app)
			.get(`/api/vitals/${vitalsId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(vitalsId);
		expect(response.body.patient).toBeDefined();
		expect(response.body.patient.id).toBe(patientId);
		expect(response.body.patient.firstName).toBe("GetById");
		expect(response.body.patient.lastName).toBe("TestPatient");
		expect(response.body.temperature.value).toBe(36.5);
		expect(response.body.temperature.unit).toBe("CELSIUS");
		expect(response.body.bloodPressure.systolic).toBe(120);
		expect(response.body.bloodPressure.diastolic).toBe(80);
		expect(response.body.heartRate).toBe(72);
		expect(response.body.respiratoryRate).toBe(16);
		expect(response.body.oxygenSaturation).toBe(98);
		expect(response.body.notes).toBe("Test vitals for get-by-id");
		expect(response.body.recordedBy).toBeDefined();
		expect(response.body.recordedBy).toHaveProperty("id");
		expect(response.body.recordedBy).toHaveProperty("firstName");
		expect(response.body.recordedBy).toHaveProperty("lastName");
		expect(response.body).toHaveProperty("recordedAt");
		expect(response.body).toHaveProperty("alerts");
	});

	it("returns patient info with patientId field", async () => {
		const response = await request(app)
			.get(`/api/vitals/${vitalsId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.patient.patientId).toMatch(
			new RegExp(`^${context.hospitalId}-P-`),
		);
	});
});
