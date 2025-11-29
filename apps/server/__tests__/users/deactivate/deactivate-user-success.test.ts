import { Account, Staff, User } from "@hms/db";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/users/:id - Deactivate user successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let createdUserId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["USER:CREATE", "USER:READ", "USER:DELETE"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a test user
		const response = await request(app)
			.post("/api/users")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				firstName: "Deactivate",
				lastName: "TestUser",
				email: `deactivate.${context.uniqueId}@test.com`,
				phone: "+1234567890",
				department: context.departmentId,
				roles: context.roleIds,
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

	it("deactivates user when the requester has USER:DELETE permission", async () => {
		const response = await request(app)
			.delete(`/api/users/${createdUserId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(createdUserId);
		expect(response.body.status).toBe("INACTIVE");
		expect(response.body.deactivatedAt).toBeDefined();

		// Verify in database
		const staff = await Staff.findById(createdUserId);
		expect(staff?.status).toBe("INACTIVE");
		expect(staff?.deactivatedAt).toBeDefined();
	});

	it("returns 404 when user does not exist", async () => {
		const response = await request(app)
			.delete("/api/users/non-existent-user-id")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.code).toBe("NOT_FOUND");
	});
});
