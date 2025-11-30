import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/roles/:id - Returns 404 for non-existent role", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["ROLE:UPDATE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 404 for non-existent role", async () => {
		const nonExistentId = uuidv4();

		const response = await request(app)
			.patch(`/api/roles/${nonExistentId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ name: "Updated Name" });

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("code", "ROLE_NOT_FOUND");
	});
});
