import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard - Success response", () => {
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

	it("returns dashboard data for authenticated user", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toBeDefined();
	});

	it("returns dashboard with overview stats for admin", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("overview");
		expect(response.body.data).toHaveProperty("patients");
		expect(response.body.data).toHaveProperty("appointments");
		expect(response.body.data).toHaveProperty("staff");
	});
});
