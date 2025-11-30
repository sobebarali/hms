import { Appointment, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard - With actual data", () => {
	let context: AuthTestContext;
	let accessToken: string;
	const patientIds: string[] = [];
	const appointmentIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"USER:READ",
				"PATIENT:READ",
				"APPOINTMENT:READ",
			],
			includeDepartment: true,
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		const now = new Date();

		// Create test patients
		for (let i = 0; i < 3; i++) {
			const patientId = uuidv4();
			patientIds.push(patientId);

			await Patient.create({
				_id: patientId,
				tenantId: context.hospitalId,
				patientId: `PAT-${context.uniqueId}-${i}`,
				firstName: `Test${i}`,
				lastName: `Patient${i}`,
				dateOfBirth: new Date("1990-01-01"),
				gender: "MALE",
				phone: `+123456789${i}`,
				email: `patient-${context.uniqueId}-${i}@test.com`,
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
		}

		// Create test appointments for today
		const today = new Date();
		today.setHours(10, 0, 0, 0);

		for (let i = 0; i < 2; i++) {
			const appointmentId = uuidv4();
			appointmentIds.push(appointmentId);

			const startTime = new Date(today);
			startTime.setHours(10 + i, 0, 0, 0);
			const endTime = new Date(startTime);
			endTime.setMinutes(endTime.getMinutes() + 30);

			await Appointment.create({
				_id: appointmentId,
				tenantId: context.hospitalId,
				appointmentNumber: `APT-${context.uniqueId}-${i}`,
				patientId: patientIds[i],
				doctorId: context.staffId,
				departmentId: context.departmentId,
				date: today,
				type: "CONSULTATION",
				status: i === 0 ? "COMPLETED" : "SCHEDULED",
				timeSlot: {
					start: startTime.toISOString(),
					end: endTime.toISOString(),
				},
				reason: "Test appointment",
				createdAt: now,
				updatedAt: now,
			});
		}
	}, 30000);

	afterAll(async () => {
		// Cleanup appointments
		for (const id of appointmentIds) {
			await Appointment.deleteOne({ _id: id });
		}

		// Cleanup patients
		for (const id of patientIds) {
			await Patient.deleteOne({ _id: id });
		}

		await context.cleanup();
	});

	it("returns dashboard with correct patient counts", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.overview.totalPatients).toBeGreaterThanOrEqual(3);
	});

	it("returns dashboard with correct appointment counts", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(
			response.body.data.overview.appointmentsToday,
		).toBeGreaterThanOrEqual(2);
	});

	it("returns dashboard with patient stats reflecting created data", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.patients.byType).toHaveProperty("opd");
		expect(response.body.data.patients.byType.opd).toBeGreaterThanOrEqual(3);
	});

	it("returns dashboard with appointment stats showing completed", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.appointments.today).toBeGreaterThanOrEqual(2);
		expect(response.body.data.appointments.completed).toBeGreaterThanOrEqual(1);
	});
});
