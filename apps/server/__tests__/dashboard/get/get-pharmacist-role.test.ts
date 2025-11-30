import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard - Pharmacist role", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "PHARMACIST",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"PRESCRIPTION:READ",
				"DISPENSING:READ",
				"DISPENSING:CREATE",
			],
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns pharmacist-specific dashboard data", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toBeDefined();
	});

	it("returns pharmacist dashboard with queue stats", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("queue");
		expect(response.body.data.queue).toHaveProperty("pending");
		expect(response.body.data.queue).toHaveProperty("urgent");
		expect(response.body.data.queue).toHaveProperty("inProgress");
		expect(response.body.data.queue).toHaveProperty("averageWait");
		expect(response.body.data.queue).toHaveProperty("nextPrescription");
	});

	it("returns pharmacist dashboard with dispensing stats", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("dispensing");
		expect(response.body.data.dispensing).toHaveProperty("completedToday");
		expect(response.body.data.dispensing).toHaveProperty("totalToday");
		expect(response.body.data.dispensing).toHaveProperty("byHour");
	});

	it("returns pharmacist dashboard with inventory stats", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("inventory");
		expect(response.body.data.inventory).toHaveProperty("lowStock");
		expect(response.body.data.inventory).toHaveProperty("expiringSoon");
		expect(response.body.data.inventory).toHaveProperty("outOfStock");
	});

	it("returns pharmacist dashboard with statistics", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("statistics");
		expect(response.body.data.statistics).toHaveProperty(
			"averageProcessingTime",
		);
		expect(response.body.data.statistics).toHaveProperty(
			"prescriptionsHandled",
		);
	});
});
