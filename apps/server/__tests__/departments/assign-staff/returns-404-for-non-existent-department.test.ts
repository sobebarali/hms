import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/departments/:id/staff - Returns 404 for non-existent department", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:MANAGE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 404 when department does not exist", async () => {
		const nonExistentId = uuidv4();

		const response = await request(app)
			.post(`/api/departments/${nonExistentId}/staff`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				userId: uuidv4(),
			});

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("code");
	});
});
