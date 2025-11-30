import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard - Receptionist role", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "RECEPTIONIST",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"PATIENT:READ",
				"PATIENT:CREATE",
				"APPOINTMENT:READ",
				"APPOINTMENT:CREATE",
			],
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns receptionist-specific dashboard data", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toBeDefined();
	});

	it("returns receptionist dashboard with registration stats", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("registrations");
		expect(response.body.data.registrations).toHaveProperty("today");
		expect(response.body.data.registrations).toHaveProperty("pending");
		expect(response.body.data.registrations).toHaveProperty(
			"recentRegistrations",
		);
	});

	it("returns receptionist dashboard with appointment stats", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("appointments");
		expect(response.body.data.appointments).toHaveProperty("todayTotal");
		expect(response.body.data.appointments).toHaveProperty("scheduled");
		expect(response.body.data.appointments).toHaveProperty("checkedIn");
		expect(response.body.data.appointments).toHaveProperty("completed");
		expect(response.body.data.appointments).toHaveProperty("cancelled");
		expect(response.body.data.appointments).toHaveProperty("upcoming");
	});

	it("returns receptionist dashboard with queue stats", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("queue");
		expect(response.body.data.queue).toHaveProperty("byDoctor");
		expect(response.body.data.queue).toHaveProperty("totalWaiting");
		expect(response.body.data.queue).toHaveProperty("averageWait");
	});

	it("returns receptionist dashboard with check-in stats", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("checkIns");
		expect(response.body.data.checkIns).toHaveProperty("completedToday");
		expect(response.body.data.checkIns).toHaveProperty("pending");
	});
});
