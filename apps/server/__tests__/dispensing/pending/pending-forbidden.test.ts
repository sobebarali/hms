import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dispensing/pending - Forbidden", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		// Create user without DISPENSING:READ permission
		context = await createAuthTestContext({
			rolePermissions: ["PATIENT:READ"], // Different permission
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 403 when user lacks DISPENSING:READ permission", async () => {
		const response = await request(app)
			.get("/api/dispensing/pending")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
	});
});
