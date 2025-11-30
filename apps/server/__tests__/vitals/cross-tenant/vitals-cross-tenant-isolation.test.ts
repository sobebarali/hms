import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("Vitals - Cross-tenant isolation", () => {
	let contextTenant1: AuthTestContext;
	let contextTenant2: AuthTestContext;
	let accessTokenTenant1: string;
	let accessTokenTenant2: string;
	let patientTenant1: string;
	let patientTenant2: string;
	let vitalsTenant1Id: string;
	let vitalsTenant2Id: string;

	beforeAll(async () => {
		// Create context for tenant 1
		contextTenant1 = await createAuthTestContext({
			rolePermissions: ["VITALS:CREATE", "VITALS:READ", "VITALS:UPDATE"],
			includeDepartment: true,
		});
		const tokens1 = await contextTenant1.issuePasswordTokens();
		accessTokenTenant1 = tokens1.accessToken;

		// Create context for tenant 2
		contextTenant2 = await createAuthTestContext({
			rolePermissions: ["VITALS:CREATE", "VITALS:READ", "VITALS:UPDATE"],
			includeDepartment: true,
		});
		const tokens2 = await contextTenant2.issuePasswordTokens();
		accessTokenTenant2 = tokens2.accessToken;

		// Create patient in tenant 1
		patientTenant1 = uuidv4();
		await Patient.create({
			_id: patientTenant1,
			tenantId: contextTenant1.hospitalId,
			patientId: `${contextTenant1.hospitalId}-P-cross1-${contextTenant1.uniqueId}`,
			firstName: "CrossTenant1",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-cross1-${contextTenant1.uniqueId}`,
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

		// Create patient in tenant 2
		patientTenant2 = uuidv4();
		await Patient.create({
			_id: patientTenant2,
			tenantId: contextTenant2.hospitalId,
			patientId: `${contextTenant2.hospitalId}-P-cross2-${contextTenant2.uniqueId}`,
			firstName: "CrossTenant2",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "FEMALE",
			phone: `+1-cross2-${contextTenant2.uniqueId}`,
			address: {
				street: "456 Test St",
				city: "Test City",
				state: "TS",
				postalCode: "54321",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Parent",
				phone: "+1-555-1111",
			},
			patientType: "OPD",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create vitals in tenant 1
		const response1 = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessTokenTenant1}`)
			.send({
				patientId: patientTenant1,
				temperature: { value: 36.5, unit: "CELSIUS" },
				heartRate: 72,
				notes: "Tenant 1 vitals",
			});
		vitalsTenant1Id = response1.body.id;

		// Create vitals in tenant 2
		const response2 = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessTokenTenant2}`)
			.send({
				patientId: patientTenant2,
				temperature: { value: 37.0, unit: "CELSIUS" },
				heartRate: 80,
				notes: "Tenant 2 vitals",
			});
		vitalsTenant2Id = response2.body.id;
	}, 60000);

	afterAll(async () => {
		await Vitals.deleteOne({ _id: vitalsTenant1Id });
		await Vitals.deleteOne({ _id: vitalsTenant2Id });
		await Patient.deleteOne({ _id: patientTenant1 });
		await Patient.deleteOne({ _id: patientTenant2 });
		await contextTenant1.cleanup();
		await contextTenant2.cleanup();
	});

	describe("Record vitals isolation", () => {
		it("tenant 1 cannot record vitals for tenant 2 patient", async () => {
			const response = await request(app)
				.post("/api/vitals")
				.set("Authorization", `Bearer ${accessTokenTenant1}`)
				.send({
					patientId: patientTenant2, // Trying to use tenant 2's patient
					temperature: { value: 36.5, unit: "CELSIUS" },
					heartRate: 72,
				});

			// Cross-tenant access is blocked - patient appears invalid/not found
			expect(response.status).toBe(404);
			expect(response.body.code).toBe("PATIENT_NOT_FOUND");
		});

		it("tenant 2 cannot record vitals for tenant 1 patient", async () => {
			const response = await request(app)
				.post("/api/vitals")
				.set("Authorization", `Bearer ${accessTokenTenant2}`)
				.send({
					patientId: patientTenant1, // Trying to use tenant 1's patient
					temperature: { value: 37.0, unit: "CELSIUS" },
					heartRate: 80,
				});

			// Cross-tenant access is blocked - patient appears invalid/not found
			expect(response.status).toBe(404);
			expect(response.body.code).toBe("PATIENT_NOT_FOUND");
		});
	});

	describe("Get vitals by ID isolation", () => {
		it("tenant 1 cannot access tenant 2 vitals by ID", async () => {
			const response = await request(app)
				.get(`/api/vitals/${vitalsTenant2Id}`)
				.set("Authorization", `Bearer ${accessTokenTenant1}`);

			// Cross-tenant access is blocked - vitals not found in tenant scope
			expect(response.status).toBe(404);
			expect(response.body.code).toBe("NOT_FOUND");
		});

		it("tenant 2 cannot access tenant 1 vitals by ID", async () => {
			const response = await request(app)
				.get(`/api/vitals/${vitalsTenant1Id}`)
				.set("Authorization", `Bearer ${accessTokenTenant2}`);

			// Cross-tenant access is blocked - vitals not found in tenant scope
			expect(response.status).toBe(404);
			expect(response.body.code).toBe("NOT_FOUND");
		});
	});

	describe("Update vitals isolation", () => {
		it("tenant 1 cannot update tenant 2 vitals", async () => {
			const response = await request(app)
				.patch(`/api/vitals/${vitalsTenant2Id}`)
				.set("Authorization", `Bearer ${accessTokenTenant1}`)
				.send({
					notes: "Attempting cross-tenant update",
					correctionReason: "Testing cross-tenant access",
				});

			// Cross-tenant access is blocked - vitals not found in tenant scope
			expect(response.status).toBe(404);
			expect(response.body.code).toBe("NOT_FOUND");
		});

		it("tenant 2 cannot update tenant 1 vitals", async () => {
			const response = await request(app)
				.patch(`/api/vitals/${vitalsTenant1Id}`)
				.set("Authorization", `Bearer ${accessTokenTenant2}`)
				.send({
					notes: "Attempting cross-tenant update",
					correctionReason: "Testing cross-tenant access",
				});

			// Cross-tenant access is blocked - vitals not found in tenant scope
			expect(response.status).toBe(404);
			expect(response.body.code).toBe("NOT_FOUND");
		});
	});

	describe("List vitals isolation", () => {
		it("tenant 1 cannot list vitals for tenant 2 patient", async () => {
			const response = await request(app)
				.get(`/api/vitals/patient/${patientTenant2}`)
				.set("Authorization", `Bearer ${accessTokenTenant1}`);

			expect(response.status).toBe(404);
			expect(response.body.code).toBe("PATIENT_NOT_FOUND");
		});

		it("tenant 2 cannot list vitals for tenant 1 patient", async () => {
			const response = await request(app)
				.get(`/api/vitals/patient/${patientTenant1}`)
				.set("Authorization", `Bearer ${accessTokenTenant2}`);

			expect(response.status).toBe(404);
			expect(response.body.code).toBe("PATIENT_NOT_FOUND");
		});
	});

	describe("Latest vitals isolation", () => {
		it("tenant 1 cannot get latest vitals for tenant 2 patient", async () => {
			const response = await request(app)
				.get(`/api/vitals/patient/${patientTenant2}/latest`)
				.set("Authorization", `Bearer ${accessTokenTenant1}`);

			expect(response.status).toBe(404);
			expect(response.body.code).toBe("PATIENT_NOT_FOUND");
		});

		it("tenant 2 cannot get latest vitals for tenant 1 patient", async () => {
			const response = await request(app)
				.get(`/api/vitals/patient/${patientTenant1}/latest`)
				.set("Authorization", `Bearer ${accessTokenTenant2}`);

			expect(response.status).toBe(404);
			expect(response.body.code).toBe("PATIENT_NOT_FOUND");
		});
	});

	describe("Trends vitals isolation", () => {
		it("tenant 1 cannot get trends for tenant 2 patient", async () => {
			const response = await request(app)
				.get(`/api/vitals/patient/${patientTenant2}/trends`)
				.query({ parameter: "heartRate" })
				.set("Authorization", `Bearer ${accessTokenTenant1}`);

			expect(response.status).toBe(404);
			expect(response.body.code).toBe("PATIENT_NOT_FOUND");
		});

		it("tenant 2 cannot get trends for tenant 1 patient", async () => {
			const response = await request(app)
				.get(`/api/vitals/patient/${patientTenant1}/trends`)
				.query({ parameter: "heartRate" })
				.set("Authorization", `Bearer ${accessTokenTenant2}`);

			expect(response.status).toBe(404);
			expect(response.body.code).toBe("PATIENT_NOT_FOUND");
		});
	});

	describe("Own tenant access works correctly", () => {
		it("tenant 1 can access own patient vitals", async () => {
			const response = await request(app)
				.get(`/api/vitals/${vitalsTenant1Id}`)
				.set("Authorization", `Bearer ${accessTokenTenant1}`);

			expect(response.status).toBe(200);
			expect(response.body.id).toBe(vitalsTenant1Id);
		});

		it("tenant 2 can access own patient vitals", async () => {
			const response = await request(app)
				.get(`/api/vitals/${vitalsTenant2Id}`)
				.set("Authorization", `Bearer ${accessTokenTenant2}`);

			expect(response.status).toBe(200);
			expect(response.body.id).toBe(vitalsTenant2Id);
		});

		it("tenant 1 can list own patient vitals", async () => {
			const response = await request(app)
				.get(`/api/vitals/patient/${patientTenant1}`)
				.set("Authorization", `Bearer ${accessTokenTenant1}`);

			expect(response.status).toBe(200);
			expect(response.body.data.length).toBeGreaterThan(0);
		});

		it("tenant 2 can list own patient vitals", async () => {
			const response = await request(app)
				.get(`/api/vitals/patient/${patientTenant2}`)
				.set("Authorization", `Bearer ${accessTokenTenant2}`);

			expect(response.status).toBe(200);
			expect(response.body.data.length).toBeGreaterThan(0);
		});
	});
});
