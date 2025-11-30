import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard/quick-stats - Nurse alerts", () => {
	let context: AuthTestContext;
	let accessToken: string;
	const patientIds: string[] = [];
	const vitalsIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "NURSE",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"PATIENT:READ",
				"VITALS:READ",
				"VITALS:CREATE",
			],
			includeDepartment: true,
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		const now = new Date();

		// Create patients and vitals with HIGH/CRITICAL severity to test alerts
		for (let i = 0; i < 2; i++) {
			const patientId = uuidv4();
			patientIds.push(patientId);

			await Patient.create({
				_id: patientId,
				tenantId: context.hospitalId,
				patientId: `PAT-NURSE-${context.uniqueId}-${i}`,
				firstName: `Test${i}`,
				lastName: `Patient${i}`,
				dateOfBirth: new Date("1990-01-01"),
				gender: "MALE",
				phone: `+123456789${i}`,
				email: `patient-nurse-${context.uniqueId}-${i}@test.com`,
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
					phone: "+1234567800",
				},
				patientType: "OPD",
				status: "ACTIVE",
				createdAt: now,
				updatedAt: now,
			});

			const vitalsId = uuidv4();
			vitalsIds.push(vitalsId);

			await Vitals.create({
				_id: vitalsId,
				tenantId: context.hospitalId,
				patientId: patientId,
				recordedBy: context.staffId,
				recordedAt: now,
				bloodPressure: {
					systolic: 180,
					diastolic: 120,
				},
				heartRate: 120,
				temperature: {
					value: 39.5,
					unit: "CELSIUS",
				},
				respiratoryRate: 25,
				oxygenSaturation: 88,
				alerts: [
					{
						type: "ABNORMAL_VITALS",
						parameter: "bloodPressure",
						value: 180,
						severity: i === 0 ? "HIGH" : "CRITICAL",
					},
				],
				notes: "Test vitals with abnormal values",
				createdAt: now,
				updatedAt: now,
			});
		}
	}, 30000);

	afterAll(async () => {
		for (const id of vitalsIds) {
			await Vitals.deleteOne({ _id: id });
		}
		for (const id of patientIds) {
			await Patient.deleteOne({ _id: id });
		}
		await context.cleanup();
	});

	it("returns quick stats with alerts for nurse", async () => {
		const response = await request(app)
			.get("/api/dashboard/quick-stats")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toHaveProperty("alerts");
		expect(response.body.data.alerts).toBeGreaterThanOrEqual(2);
	});

	it("returns quick stats with correct structure", async () => {
		const response = await request(app)
			.get("/api/dashboard/quick-stats")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("notifications");
		expect(response.body.data).toHaveProperty("pendingTasks");
		expect(response.body.data).toHaveProperty("alerts");
	});
});
