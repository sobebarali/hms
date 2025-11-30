import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/departments/:id/staff - Returns 404 for non-existent user", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:MANAGE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create department
		const dept = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `User Not Found Department ${context.uniqueId}`,
			code: `UNF${context.uniqueId}`
				.toUpperCase()
				.replace(/-/g, "")
				.slice(0, 10),
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		departmentId = String(dept._id);
	}, 30000);

	afterAll(async () => {
		if (departmentId) {
			await Department.deleteOne({ _id: departmentId });
		}
		await context.cleanup();
	});

	it("returns 404 when user does not exist", async () => {
		const nonExistentUserId = uuidv4();

		const response = await request(app)
			.post(`/api/departments/${departmentId}/staff`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				userId: nonExistentUserId,
			});

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("code");
	});
});
