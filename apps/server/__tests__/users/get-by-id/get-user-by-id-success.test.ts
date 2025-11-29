import { Account, Staff, User } from "@hms/db";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/users/:id - Get user by ID successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let createdUserId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["USER:CREATE", "USER:READ"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a test user
		const response = await request(app)
			.post("/api/users")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				firstName: "GetById",
				lastName: "TestUser",
				email: `getbyid.${context.uniqueId}@test.com`,
				phone: "+1234567890",
				department: context.departmentId,
				roles: context.roleIds,
				specialization: "Cardiology",
				shift: "MORNING",
			});

		if (response.status === 201) {
			createdUserId = response.body.id;
		}
	}, 30000);

	afterAll(async () => {
		// Clean up created user
		if (createdUserId) {
			const staff = await Staff.findById(createdUserId);
			if (staff) {
				await Account.deleteOne({ userId: staff.userId });
				await User.deleteOne({ _id: staff.userId });
				await Staff.deleteOne({ _id: createdUserId });
			}
		}
		await context.cleanup();
	});

	it("returns user details when the requester has USER:READ permission", async () => {
		const response = await request(app)
			.get(`/api/users/${createdUserId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(createdUserId);
		expect(response.body.firstName).toBe("GetById");
		expect(response.body.lastName).toBe("TestUser");
		expect(response.body.email).toBe(`getbyid.${context.uniqueId}@test.com`);
		expect(response.body.department).toBe(context.departmentId);
		expect(response.body.specialization).toBe("Cardiology");
		expect(response.body.shift).toBe("MORNING");
		expect(response.body.status).toBe("ACTIVE");
		expect(response.body.roles).toBeInstanceOf(Array);
		expect(response.body.roles.length).toBeGreaterThan(0);
		expect(response.body.createdAt).toBeDefined();
		expect(response.body.updatedAt).toBeDefined();
	});

	it("returns 404 when user does not exist", async () => {
		const response = await request(app)
			.get("/api/users/non-existent-user-id")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.code).toBe("NOT_FOUND");
	});
});
