import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/vitals/patient/:patientId - Filters", () => {
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
			patientId: `${context.hospitalId}-P-filter-${context.uniqueId}`,
			firstName: "Filter",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-filter-${context.uniqueId}`,
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

		// Create vitals with only temperature
		const tempResponse = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				temperature: { value: 36.5, unit: "CELSIUS" },
			});
		createdVitalsIds.push(tempResponse.body.id);

		// Create vitals with only blood pressure
		const bpResponse = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				bloodPressure: { systolic: 120, diastolic: 80 },
			});
		createdVitalsIds.push(bpResponse.body.id);

		// Create vitals with only heart rate
		const hrResponse = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				heartRate: 72,
			});
		createdVitalsIds.push(hrResponse.body.id);
	}, 30000);

	afterAll(async () => {
		for (const id of createdVitalsIds) {
			await Vitals.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("filters by temperature parameter", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}?parameter=temperature`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBe(1);
		expect(response.body.data[0].temperature).toBeDefined();
	});

	it("filters by bloodPressure parameter", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}?parameter=bloodPressure`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBe(1);
		expect(response.body.data[0].bloodPressure).toBeDefined();
	});

	it("filters by heartRate parameter", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}?parameter=heartRate`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBe(1);
		expect(response.body.data[0].heartRate).toBeDefined();
	});

	it("returns 400 for invalid date range (start > end)", async () => {
		const futureDate = new Date(Date.now() + 86400000).toISOString();
		const pastDate = new Date(Date.now() - 86400000).toISOString();

		const response = await request(app)
			.get(
				`/api/vitals/patient/${patientId}?startDate=${futureDate}&endDate=${pastDate}`,
			)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_DATE_RANGE");
	});

	it("filters by date range", async () => {
		const startDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
		const endDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

		const response = await request(app)
			.get(
				`/api/vitals/patient/${patientId}?startDate=${startDate}&endDate=${endDate}`,
			)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThan(0);
	});
});
