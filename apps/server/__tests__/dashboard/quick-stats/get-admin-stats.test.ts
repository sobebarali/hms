import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard/quick-stats - Admin stats", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"USER:READ",
				"PATIENT:READ",
				"APPOINTMENT:READ",
			],
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns quick stats for admin with default values", async () => {
		const response = await request(app)
			.get("/api/dashboard/quick-stats")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toHaveProperty("notifications");
		expect(response.body.data).toHaveProperty("pendingTasks");
		expect(response.body.data).toHaveProperty("alerts");
	});

	it("returns admin quick stats with zero pending tasks", async () => {
		const response = await request(app)
			.get("/api/dashboard/quick-stats")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		// Admin role doesn't have role-specific pending tasks
		expect(response.body.data.pendingTasks).toBe(0);
		expect(response.body.data.alerts).toBe(0);
		expect(response.body.data.notifications).toBe(0);
	});
});
