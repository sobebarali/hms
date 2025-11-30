import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard/widgets/:widgetId - Doctor appointment trend access", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		// DOCTOR role should have access to appointment-trend widget
		context = await createAuthTestContext({
			roleName: "DOCTOR",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"PATIENT:READ",
				"APPOINTMENT:READ",
				"PRESCRIPTION:READ",
			],
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns appointment trend widget data for doctor", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/appointment-trend")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toHaveProperty("widgetId");
		expect(response.body.data.widgetId).toBe("appointment-trend");
		expect(response.body.data).toHaveProperty("data");
		expect(response.body.data).toHaveProperty("updatedAt");
	});

	it("returns 403 when doctor accesses patient-trend widget", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/patient-trend")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.code).toBe("WIDGET_ACCESS_DENIED");
	});

	it("returns 403 when doctor accesses revenue-trend widget", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/revenue-trend")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.code).toBe("WIDGET_ACCESS_DENIED");
	});
});
