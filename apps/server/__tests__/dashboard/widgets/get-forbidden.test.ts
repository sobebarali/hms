import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard/widgets/:widgetId - Forbidden access", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		// RECEPTIONIST role should NOT have access to patient-trend widget
		context = await createAuthTestContext({
			roleName: "RECEPTIONIST",
			rolePermissions: ["DASHBOARD:VIEW", "PATIENT:READ", "APPOINTMENT:READ"],
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 403 when receptionist accesses patient-trend widget", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/patient-trend")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.code).toBe("WIDGET_ACCESS_DENIED");
	});

	it("returns 403 when receptionist accesses revenue-trend widget", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/revenue-trend")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.code).toBe("WIDGET_ACCESS_DENIED");
	});

	it("returns 403 when receptionist accesses department-load widget", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/department-load")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.code).toBe("WIDGET_ACCESS_DENIED");
	});

	it("returns 403 when receptionist accesses staff-attendance widget", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/staff-attendance")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.code).toBe("WIDGET_ACCESS_DENIED");
	});

	it("returns 403 when receptionist accesses bed-occupancy widget", async () => {
		const response = await request(app)
			.get("/api/dashboard/widgets/bed-occupancy")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.code).toBe("WIDGET_ACCESS_DENIED");
	});
});
