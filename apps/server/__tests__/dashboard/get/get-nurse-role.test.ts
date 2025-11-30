import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard - Nurse role", () => {
	let context: AuthTestContext;
	let accessToken: string;

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
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns nurse-specific dashboard data", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toBeDefined();
	});

	it("returns nurse dashboard with ward stats", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("ward");
		expect(response.body.data.ward).toHaveProperty("name");
		expect(response.body.data.ward).toHaveProperty("totalBeds");
		expect(response.body.data.ward).toHaveProperty("occupiedBeds");
		expect(response.body.data.ward).toHaveProperty("availableBeds");
	});

	it("returns nurse dashboard with patient stats", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("patients");
		expect(response.body.data.patients).toHaveProperty("assigned");
		expect(response.body.data.patients).toHaveProperty("critical");
		expect(response.body.data.patients).toHaveProperty("needsAttention");
	});

	it("returns nurse dashboard with vitals stats", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("vitals");
		expect(response.body.data.vitals).toHaveProperty("pendingRecording");
		expect(response.body.data.vitals).toHaveProperty("recordedToday");
		expect(response.body.data.vitals).toHaveProperty("abnormal");
	});

	it("returns nurse dashboard with tasks and alerts", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("tasks");
		expect(response.body.data.tasks).toHaveProperty("medicationDue");
		expect(response.body.data.tasks).toHaveProperty("vitalsDue");
		expect(response.body.data.tasks).toHaveProperty("pending");
		expect(response.body.data).toHaveProperty("alerts");
	});
});
