import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/dispensing/:prescriptionId/return - Forbidden", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["DISPENSING:READ"], // No DISPENSING:UPDATE permission
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 403 when user lacks DISPENSING:UPDATE permission", async () => {
		const prescriptionId = uuidv4();
		const response = await request(app)
			.post(`/api/dispensing/${prescriptionId}/return`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				reason: "Need to verify dosage",
			});

		expect(response.status).toBe(403);
	});
});
