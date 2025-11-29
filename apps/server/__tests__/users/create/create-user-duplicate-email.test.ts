import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/users - Duplicate email error", () => {
	let context: AuthTestContext;
	let accessToken: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["USER:CREATE", "USER:READ"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		await context.cleanup();
	});

	it("returns 409 when email already exists in tenant", async () => {
		// Use the email of the existing user from context
		const payload = {
			firstName: "Duplicate",
			lastName: "User",
			email: context.email, // This email already exists
			phone: "+1234567890",
			department: context.departmentId,
			roles: context.roleIds,
		};

		const response = await request(app)
			.post("/api/users")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(409);
		expect(response.body.code).toBe("EMAIL_EXISTS");
		expect(response.body.message).toContain("Email already in use");
	});
});
