import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard - Multiple roles", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		// Create user with DOCTOR as primary role and NURSE as secondary
		// DOCTOR is higher in hierarchy, so should get doctor dashboard
		context = await createAuthTestContext({
			roleName: "DOCTOR",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"PATIENT:READ",
				"APPOINTMENT:READ",
				"PRESCRIPTION:READ",
				"PRESCRIPTION:CREATE",
			],
			extraRoles: [
				{
					name: "NURSE",
					permissions: ["DASHBOARD:VIEW", "PATIENT:READ", "VITALS:READ"],
				},
			],
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns dashboard for highest role in hierarchy", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toBeDefined();
	});

	it("returns doctor dashboard structure when user has DOCTOR and NURSE roles", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);

		// Doctor dashboard structure
		expect(response.body.data).toHaveProperty("today");
		expect(response.body.data).toHaveProperty("appointments");
		expect(response.body.data).toHaveProperty("patients");
		expect(response.body.data).toHaveProperty("prescriptions");
		expect(response.body.data).toHaveProperty("queue");

		// Should NOT have nurse-specific properties
		expect(response.body.data).not.toHaveProperty("ward");
		expect(response.body.data).not.toHaveProperty("vitals");
		expect(response.body.data).not.toHaveProperty("tasks");
	});

	it("returns doctor today stats with correct structure", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.today).toHaveProperty("totalAppointments");
		expect(response.body.data.today).toHaveProperty("completed");
		expect(response.body.data.today).toHaveProperty("remaining");
		expect(response.body.data.today).toHaveProperty("currentPatient");
		expect(response.body.data.today).toHaveProperty("nextPatient");
	});
});
