import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/vitals/patient/:patientId/trends - Trends vitals success", () => {
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
			patientId: `${context.hospitalId}-P-trends-${context.uniqueId}`,
			firstName: "Trends",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-trends-${context.uniqueId}`,
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

		// Create multiple vitals records with different values for trending
		for (let i = 0; i < 5; i++) {
			const response = await request(app)
				.post("/api/vitals")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({
					patientId,
					temperature: { value: 36.5 + i * 0.2, unit: "CELSIUS" },
					heartRate: 70 + i * 2,
					bloodPressure: { systolic: 110 + i * 2, diastolic: 70 + i },
					respiratoryRate: 14 + i,
					oxygenSaturation: 98 - i * 0.5,
					painLevel: i,
					notes: `Vitals record ${i + 1}`,
				});
			createdVitalsIds.push(response.body.id);
			// Small delay to ensure different timestamps
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
	}, 30000);

	afterAll(async () => {
		for (const id of createdVitalsIds) {
			await Vitals.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("returns heart rate trends successfully", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "heartRate" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("patientId", patientId);
		expect(response.body).toHaveProperty("parameter", "heartRate");
		expect(response.body).toHaveProperty("unit");
		expect(response.body).toHaveProperty("dataPoints");
		expect(response.body).toHaveProperty("statistics");
		expect(response.body).toHaveProperty("dateRange");
	});

	it("returns temperature trends successfully", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "temperature" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.parameter).toBe("temperature");
		expect(response.body.dataPoints.length).toBe(5);
	});

	it("returns blood pressure trends with secondary values", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "bloodPressure" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.parameter).toBe("bloodPressure");
		expect(response.body.dataPoints.length).toBe(5);
		// Blood pressure should have secondary value (diastolic)
		expect(response.body.dataPoints[0]).toHaveProperty("value"); // systolic
		expect(response.body.dataPoints[0]).toHaveProperty("secondaryValue"); // diastolic
		expect(response.body.statistics).toHaveProperty("minSecondary");
		expect(response.body.statistics).toHaveProperty("maxSecondary");
		expect(response.body.statistics).toHaveProperty("avgSecondary");
	});

	it("returns oxygen saturation trends successfully", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "oxygenSaturation" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.parameter).toBe("oxygenSaturation");
		expect(response.body.dataPoints.length).toBe(5);
	});

	it("returns pain level trends successfully", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "painLevel" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.parameter).toBe("painLevel");
		expect(response.body.dataPoints.length).toBe(5);
	});

	it("returns respiratory rate trends successfully", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "respiratoryRate" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.parameter).toBe("respiratoryRate");
		expect(response.body.dataPoints.length).toBe(5);
	});

	it("returns correct data point structure", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "heartRate" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		const dataPoint = response.body.dataPoints[0];
		expect(dataPoint).toHaveProperty("value");
		expect(dataPoint).toHaveProperty("recordedAt");
		expect(dataPoint).toHaveProperty("vitalsId");
		expect(typeof dataPoint.value).toBe("number");
	});

	it("returns correct statistics structure", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "heartRate" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		const { statistics } = response.body;
		expect(statistics).toHaveProperty("min");
		expect(statistics).toHaveProperty("max");
		expect(statistics).toHaveProperty("avg");
		expect(statistics).toHaveProperty("count");
		expect(statistics.count).toBe(5);
		expect(statistics.min).toBeLessThanOrEqual(statistics.max);
	});

	it("returns correct date range structure", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "heartRate" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		const { dateRange } = response.body;
		expect(dateRange).toHaveProperty("start");
		expect(dateRange).toHaveProperty("end");
		// Start should be before or equal to end
		expect(new Date(dateRange.start).getTime()).toBeLessThanOrEqual(
			new Date(dateRange.end).getTime(),
		);
	});

	it("respects limit parameter", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}/trends`)
			.query({ parameter: "heartRate", limit: "3" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.dataPoints.length).toBeLessThanOrEqual(3);
	});

	it("returns empty data points for patient with no vitals", async () => {
		// Create a new patient without vitals
		const emptyPatientId = uuidv4();
		await Patient.create({
			_id: emptyPatientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-empty-trends-${context.uniqueId}`,
			firstName: "Empty",
			lastName: "TrendsPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "FEMALE",
			phone: `+1-empty-trends-${context.uniqueId}`,
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
				.get(`/api/vitals/patient/${emptyPatientId}/trends`)
				.query({ parameter: "heartRate" })
				.set("Authorization", `Bearer ${accessToken}`);

			expect(response.status).toBe(200);
			expect(response.body.patientId).toBe(emptyPatientId);
			expect(response.body.dataPoints).toEqual([]);
			expect(response.body.statistics.count).toBe(0);
		} finally {
			await Patient.deleteOne({ _id: emptyPatientId });
		}
	});
});
