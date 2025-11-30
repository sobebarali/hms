import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/menu - Success response", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"USER:READ",
				"USER:CREATE",
				"PATIENT:READ",
				"PATIENT:CREATE",
				"DOCTOR:READ",
				"PRESCRIPTION:READ",
				"PRESCRIPTION:CREATE",
				"APPOINTMENT:READ",
				"APPOINTMENT:CREATE",
				"DEPARTMENT:MANAGE",
				"REPORT:READ",
				"SETTINGS:MANAGE",
				"QUEUE:MANAGE",
			],
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns menu structure for authenticated user", async () => {
		const response = await request(app)
			.get("/api/menu")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toHaveProperty("menu");
		expect(response.body.data).toHaveProperty("permissions");
		expect(Array.isArray(response.body.data.menu)).toBe(true);
		expect(Array.isArray(response.body.data.permissions)).toBe(true);
	});

	it("returns menu items with correct structure", async () => {
		const response = await request(app)
			.get("/api/menu")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);

		const { menu } = response.body.data;
		expect(menu.length).toBeGreaterThan(0);

		// Check first menu item has required fields
		const firstItem = menu[0];
		expect(firstItem).toHaveProperty("id");
		expect(firstItem).toHaveProperty("label");
		expect(firstItem).toHaveProperty("icon");
		expect(firstItem).toHaveProperty("permission");
		expect(firstItem).toHaveProperty("order");
		expect(firstItem).toHaveProperty("visible");
		expect(firstItem.visible).toBe(true);
	});

	it("returns dashboard as first menu item", async () => {
		const response = await request(app)
			.get("/api/menu")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);

		const { menu } = response.body.data;
		const dashboard = menu.find(
			(item: { id: string }) => item.id === "dashboard",
		);
		expect(dashboard).toBeDefined();
		expect(dashboard.label).toBe("Dashboard");
		expect(dashboard.icon).toBe("dashboard");
		expect(dashboard.path).toBe("/dashboard");
	});

	it("returns menu items with children correctly structured", async () => {
		const response = await request(app)
			.get("/api/menu")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);

		const { menu } = response.body.data;
		const usersMenu = menu.find((item: { id: string }) => item.id === "users");

		expect(usersMenu).toBeDefined();
		expect(usersMenu.children).toBeDefined();
		expect(Array.isArray(usersMenu.children)).toBe(true);
		expect(usersMenu.children.length).toBeGreaterThan(0);

		// Check child item structure
		const firstChild = usersMenu.children[0];
		expect(firstChild).toHaveProperty("id");
		expect(firstChild).toHaveProperty("label");
		expect(firstChild).toHaveProperty("path");
		expect(firstChild).toHaveProperty("permission");
		expect(firstChild).toHaveProperty("order");
	});

	it("returns user permissions array", async () => {
		const response = await request(app)
			.get("/api/menu")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);

		const { permissions } = response.body.data;
		expect(permissions).toContain("DASHBOARD:VIEW");
		expect(permissions).toContain("USER:READ");
		expect(permissions).toContain("PATIENT:READ");
	});
});
