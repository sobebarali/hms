import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/departments/:id/staff/:userId - Returns 400 for not assigned user", () => {
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
			name: `Not Assigned Department ${context.uniqueId}`,
			code: `NAS${context.uniqueId}`
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

	it("returns 400 when user is not assigned to the department", async () => {
		const notAssignedUserId = uuidv4();

		const response = await request(app)
			.delete(`/api/departments/${departmentId}/staff/${notAssignedUserId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("code");
		expect(response.body.code).toBe("NOT_ASSIGNED");
	});
});
