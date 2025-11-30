import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/roles - Returns 401 without authentication", () => {
	let context: AuthTestContext;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["ROLE:READ"],
		});
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 401 without authentication", async () => {
		const response = await request(app).get("/api/roles");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});
});
