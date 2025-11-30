import { Appointment } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard/quick-stats - Doctor stats", () => {
	let context: AuthTestContext;
	let accessToken: string;
	const appointmentIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "DOCTOR",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"PATIENT:READ",
				"APPOINTMENT:READ",
				"PRESCRIPTION:READ",
			],
			includeDepartment: true,
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		const now = new Date();

		// Create appointments for today to test pending tasks count
		const today = new Date();
		today.setHours(14, 0, 0, 0);

		// Create scheduled appointment
		const scheduledId = uuidv4();
		appointmentIds.push(scheduledId);
		const startTime = new Date(today);
		const endTime = new Date(today);
		endTime.setMinutes(endTime.getMinutes() + 30);

		await Appointment.create({
			_id: scheduledId,
			tenantId: context.hospitalId,
			appointmentNumber: `APT-DR-${context.uniqueId}-1`,
			patientId: uuidv4(),
			doctorId: context.staffId,
			departmentId: context.departmentId,
			date: today,
			type: "CONSULTATION",
			status: "SCHEDULED",
			timeSlot: {
				start: startTime.toISOString(),
				end: endTime.toISOString(),
			},
			reason: "Test appointment",
			createdAt: now,
			updatedAt: now,
		});

		// Create checked-in appointment
		const checkedInId = uuidv4();
		appointmentIds.push(checkedInId);
		const startTime2 = new Date(today);
		startTime2.setHours(15, 0, 0, 0);
		const endTime2 = new Date(startTime2);
		endTime2.setMinutes(endTime2.getMinutes() + 30);

		await Appointment.create({
			_id: checkedInId,
			tenantId: context.hospitalId,
			appointmentNumber: `APT-DR-${context.uniqueId}-2`,
			patientId: uuidv4(),
			doctorId: context.staffId,
			departmentId: context.departmentId,
			date: today,
			type: "CONSULTATION",
			status: "CHECKED_IN",
			timeSlot: {
				start: startTime2.toISOString(),
				end: endTime2.toISOString(),
			},
			reason: "Test appointment 2",
			createdAt: now,
			updatedAt: now,
		});
	}, 30000);

	afterAll(async () => {
		for (const id of appointmentIds) {
			await Appointment.deleteOne({ _id: id });
		}
		await context.cleanup();
	});

	it("returns quick stats with pending tasks for doctor", async () => {
		const response = await request(app)
			.get("/api/dashboard/quick-stats")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toHaveProperty("pendingTasks");
		expect(response.body.data.pendingTasks).toBeGreaterThanOrEqual(2);
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
