import { Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/vitals/patient/:patientId/trends - Validation errors", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["VITALS:READ"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a patient
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-trends-val-${context.uniqueId}`,
			firstName: "TrendsVal",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-trends-val-${context.uniqueId}`,
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
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("returns 400 when parameter is missing", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
	});

	it("returns 400 when parameter is invalid", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "invalidParameter" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
	});

	it("returns 400 when startDate is after endDate", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({
				parameter: "heartRate",
				startDate: "2024-12-31",
				endDate: "2024-01-01",
			})
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_DATE_RANGE");
	});

	it("accepts valid parameter: temperature", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "temperature" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid parameter: bloodPressure", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "bloodPressure" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid parameter: heartRate", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "heartRate" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid parameter: respiratoryRate", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "respiratoryRate" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid parameter: oxygenSaturation", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "oxygenSaturation" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid parameter: weight", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "weight" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid parameter: height", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "height" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid parameter: bmi", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "bmi" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid parameter: bloodGlucose", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "bloodGlucose" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid parameter: painLevel", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "painLevel" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid date range", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({
				parameter: "heartRate",
				startDate: "2024-01-01",
				endDate: "2024-12-31",
			})
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});

	it("accepts valid limit parameter", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "heartRate", limit: "10" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
	});
});
