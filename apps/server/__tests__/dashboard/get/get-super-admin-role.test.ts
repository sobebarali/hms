import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard - Super Admin role", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "SUPER_ADMIN",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"USER:READ",
				"USER:CREATE",
				"USER:UPDATE",
				"USER:DELETE",
				"PATIENT:READ",
				"APPOINTMENT:READ",
				"HOSPITAL:READ",
				"HOSPITAL:UPDATE",
			],
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns super admin dashboard data", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toBeDefined();
	});

	it("returns same structure as hospital admin dashboard", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("overview");
		expect(response.body.data).toHaveProperty("patients");
		expect(response.body.data).toHaveProperty("appointments");
		expect(response.body.data).toHaveProperty("staff");
	});

	it("returns overview stats with all required fields", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.overview).toHaveProperty("totalPatients");
		expect(response.body.data.overview).toHaveProperty("activePatients");
		expect(response.body.data.overview).toHaveProperty("opdToday");
		expect(response.body.data.overview).toHaveProperty("ipdCurrent");
		expect(response.body.data.overview).toHaveProperty("appointmentsToday");
		expect(response.body.data.overview).toHaveProperty("prescriptionsToday");
	});

	it("returns patient stats with all required fields", async () => {
		const response = await request(app)
			.get("/api/dashboard")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.patients).toHaveProperty("newThisWeek");
		expect(response.body.data.patients).toHaveProperty("newThisMonth");
		expect(response.body.data.patients).toHaveProperty("byType");
		expect(response.body.data.patients).toHaveProperty("byDepartment");
		expect(response.body.data.patients).toHaveProperty("trend");
	});
});
