import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/roles/:id - Returns 401 without authentication", () => {
	let context: AuthTestContext;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["ROLE:DELETE"],
		});
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 401 without authentication", async () => {
		const response = await request(app).delete("/api/roles/some-id");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("code");
	});
});
