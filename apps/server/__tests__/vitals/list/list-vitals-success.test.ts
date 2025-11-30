import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/vitals/patient/:patientId - List vitals success", () => {
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
			patientId: `${context.hospitalId}-P-list-${context.uniqueId}`,
			firstName: "List",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-list-${context.uniqueId}`,
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

		// Create multiple vitals records
		for (let i = 0; i < 3; i++) {
			const response = await request(app)
				.post("/api/vitals")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({
					patientId,
					temperature: { value: 36.5 + i * 0.1, unit: "CELSIUS" },
					heartRate: 70 + i,
					notes: `Vitals record ${i + 1}`,
				});
			createdVitalsIds.push(response.body.id);
		}
	}, 30000);

	afterAll(async () => {
		for (const id of createdVitalsIds) {
			await Vitals.deleteOne({ _id: id });
		}
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("lists vitals records for patient successfully", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body).toHaveProperty("pagination");
		expect(response.body).toHaveProperty("latestVitals");
		expect(Array.isArray(response.body.data)).toBe(true);
		expect(response.body.data.length).toBe(3);
	});

	it("returns pagination metadata", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.pagination).toHaveProperty("page");
		expect(response.body.pagination).toHaveProperty("limit");
		expect(response.body.pagination).toHaveProperty("total");
		expect(response.body.pagination).toHaveProperty("totalPages");
		expect(response.body.pagination.total).toBe(3);
	});

	it("returns latestVitals summary", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.latestVitals).toBeDefined();
		expect(response.body.latestVitals).toHaveProperty("temperature");
		expect(response.body.latestVitals).toHaveProperty("heartRate");
	});

	it("returns vitals records with all expected fields", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		const record = response.body.data[0];
		expect(record).toHaveProperty("id");
		expect(record).toHaveProperty("patientId");
		expect(record).toHaveProperty("recordedBy");
		expect(record).toHaveProperty("recordedAt");
		expect(record).toHaveProperty("alerts");
		expect(record.recordedBy).toHaveProperty("id");
		expect(record.recordedBy).toHaveProperty("firstName");
		expect(record.recordedBy).toHaveProperty("lastName");
	});
});
