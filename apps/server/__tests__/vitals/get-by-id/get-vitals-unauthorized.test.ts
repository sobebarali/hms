import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/vitals/:id - Unauthorized", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["PATIENT:READ"], // No VITALS:READ permission
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 401 when no authorization header is provided", async () => {
		const vitalsId = uuidv4();

		const response = await request(app).get(`/api/vitals/${vitalsId}`);

		expect(response.status).toBe(401);
	});

	it("returns 401 when token is invalid", async () => {
		const vitalsId = uuidv4();

		const response = await request(app)
			.get(`/api/vitals/${vitalsId}`)
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
	});

	it("returns 403 when user lacks VITALS:READ permission", async () => {
		const vitalsId = uuidv4();

		const response = await request(app)
			.get(`/api/vitals/${vitalsId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(403);
	});
});
