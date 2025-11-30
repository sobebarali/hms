import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/roles/:id - Returns 403 without permission", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		// Create context with no ROLE:UPDATE permission
		context = await createAuthTestContext({
			roleName: "RECEPTIONIST",
			rolePermissions: ["PATIENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 403 without ROLE:UPDATE permission", async () => {
		const response = await request(app)
			.patch(`/api/roles/${uuidv4()}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ name: "Updated" });

		expect(response.status).toBe(403);
		expect(response.body).toHaveProperty("code");
	});
});
