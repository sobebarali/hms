import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/vitals/patient/:patientId - Pagination", () => {
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
			patientId: `${context.hospitalId}-P-page-${context.uniqueId}`,
			firstName: "Pagination",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-page-${context.uniqueId}`,
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

		// Create 5 vitals records
		for (let i = 0; i < 5; i++) {
			const response = await request(app)
				.post("/api/vitals")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({
					patientId,
					heartRate: 70 + i,
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

	it("uses default pagination (page=1, limit=20)", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.pagination.page).toBe(1);
		expect(response.body.pagination.limit).toBe(20);
		expect(response.body.data.length).toBe(5);
	});

	it("respects custom page and limit parameters", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}?page=1&limit=2`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.pagination.page).toBe(1);
		expect(response.body.pagination.limit).toBe(2);
		expect(response.body.data.length).toBe(2);
		expect(response.body.pagination.total).toBe(5);
		expect(response.body.pagination.totalPages).toBe(3);
	});

	it("returns second page correctly", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}?page=2&limit=2`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.pagination.page).toBe(2);
		expect(response.body.data.length).toBe(2);
	});

	it("returns empty data when page exceeds available data", async () => {
		const response = await request(app)
			.get(`/api/vitals/patient/${patientId}?page=10&limit=20`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toEqual([]);
		expect(response.body.pagination.total).toBe(5);
	});
});
