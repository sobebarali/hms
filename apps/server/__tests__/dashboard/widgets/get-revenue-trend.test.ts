import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard/widgets/:widgetId - Revenue trend", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DASHBOARD:VIEW"],
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns revenue trend widget data for hospital admin", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/revenue-trend")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toHaveProperty("widgetId");
		expect(response.body.data.widgetId).toBe("revenue-trend");
		expect(response.body.data).toHaveProperty("data");
		expect(response.body.data).toHaveProperty("updatedAt");
	});
});
