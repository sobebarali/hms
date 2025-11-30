import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard/widgets/:widgetId - Nurse bed occupancy access", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		// NURSE role should have access to bed-occupancy widget
		context = await createAuthTestContext({
			roleName: "NURSE",
			rolePermissions: ["DASHBOARD:VIEW", "PATIENT:READ", "VITALS:READ"],
			includeDepartment: true,
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns bed occupancy widget data for nurse", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/bed-occupancy")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toHaveProperty("widgetId");
		expect(response.body.data.widgetId).toBe("bed-occupancy");
		expect(response.body.data).toHaveProperty("data");
		expect(response.body.data).toHaveProperty("updatedAt");
	});

	it("returns 403 when nurse accesses patient-trend widget", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/patient-trend")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.code).toBe("WIDGET_ACCESS_DENIED");
	});
});
