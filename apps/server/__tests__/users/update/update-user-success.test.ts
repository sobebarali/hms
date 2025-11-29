import { Account, Staff, User } from "@hms/db";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/users/:id - Update user successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let createdUserId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["USER:CREATE", "USER:READ", "USER:UPDATE"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a test user
		const response = await request(app)
			.post("/api/users")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				firstName: "Update",
				lastName: "TestUser",
				email: `update.${context.uniqueId}@test.com`,
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

	it("updates user when the requester has USER:UPDATE permission", async () => {
		const updatePayload = {
			firstName: "Updated",
			lastName: "UserName",
			phone: "+9876543210",
			specialization: "Neurology",
			shift: "EVENING",
		};

		const response = await request(app)
			.patch(`/api/users/${createdUserId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(updatePayload);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(createdUserId);
		expect(response.body.firstName).toBe("Updated");
		expect(response.body.lastName).toBe("UserName");
		expect(response.body.phone).toBe("+9876543210");
		expect(response.body.specialization).toBe("Neurology");
		expect(response.body.shift).toBe("EVENING");
		expect(response.body.updatedAt).toBeDefined();

		// Verify in database
		const staff = await Staff.findById(createdUserId);
		expect(staff?.firstName).toBe("Updated");
		expect(staff?.lastName).toBe("UserName");
	});

	it("returns 404 when user does not exist", async () => {
		const response = await request(app)
			.patch("/api/users/non-existent-user-id")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ firstName: "Test" });

		expect(response.status).toBe(404);
		expect(response.body.code).toBe("NOT_FOUND");
	});
});
