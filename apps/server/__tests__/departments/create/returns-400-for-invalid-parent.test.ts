import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/departments - Returns 400 for invalid parent", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:CREATE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 400 when parentId does not exist", async () => {
		const payload = {
			name: `Test Department ${context.uniqueId}`,
			code: `PARENT${Date.now()}`,
			type: "CLINICAL",
			parentId: uuidv4(),
		};

		const response = await request(app)
			.post("/api/departments")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_PARENT");
	});
});
