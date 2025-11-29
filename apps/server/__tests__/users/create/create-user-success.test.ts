import { Account, Staff, User } from "@hms/db";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/users - Create user successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	const createdUserIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["USER:CREATE", "USER:READ"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		// Clean up created users
		for (const staffId of createdUserIds) {
			const staff = await Staff.findById(staffId);
			if (staff) {
				await Account.deleteOne({ userId: staff.userId });
				await User.deleteOne({ _id: staff.userId });
				await Staff.deleteOne({ _id: staffId });
			}
		}
		await context.cleanup();
	});

	it("creates a user when the requester has USER:CREATE permission", async () => {
		const payload = {
			firstName: "John",
			lastName: "Doe",
			email: `john.doe.${context.uniqueId}@test.com`,
			phone: "+1234567890",
			department: context.departmentId,
			roles: context.roleIds,
			specialization: "General Medicine",
			shift: "MORNING",
		};

		const response = await request(app)
			.post("/api/users")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toMatchObject({
			email: payload.email,
			firstName: payload.firstName,
			lastName: payload.lastName,
			department: context.departmentId,
			status: "ACTIVE",
		});
		expect(response.body.id).toBeDefined();
		expect(response.body.username).toBeDefined();
		expect(response.body.roles).toBeInstanceOf(Array);
		expect(response.body.roles.length).toBeGreaterThan(0);
		expect(response.body.message).toContain("Welcome email sent");

		createdUserIds.push(response.body.id);

		// Verify user was created in database
		const staff = await Staff.findById(response.body.id);
		expect(staff).not.toBeNull();
		expect(staff?.firstName).toBe(payload.firstName);
		expect(staff?.lastName).toBe(payload.lastName);
		expect(staff?.status).toBe("ACTIVE");
	});
});
