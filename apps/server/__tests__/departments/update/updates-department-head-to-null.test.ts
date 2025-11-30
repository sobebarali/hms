import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/departments/:id - Updates department head to null", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:UPDATE", "DEPARTMENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create test department with a head
		const department = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Null Head Test ${context.uniqueId}`,
			code: `NULLHD${Date.now()}`,
			type: "CLINICAL",
			headId: context.staffId,
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		departmentId = String(department._id);
	}, 30000);

	afterAll(async () => {
		if (departmentId) {
			await Department.deleteOne({ _id: departmentId });
		}
		await context.cleanup();
	});

	it("clears department head when headId is set to null", async () => {
		const response = await request(app)
			.patch(`/api/departments/${departmentId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ headId: null });

		expect(response.status).toBe(200);
		expect(response.body.headId).toBeUndefined();
	});
});
