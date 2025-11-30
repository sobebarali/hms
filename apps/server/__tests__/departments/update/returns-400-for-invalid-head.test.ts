import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/departments/:id - Returns 400 for invalid head", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:UPDATE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create test department
		const department = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Invalid Head Test ${context.uniqueId}`,
			code: `INVHEAD${Date.now()}`,
			type: "CLINICAL",
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

	it("returns 400 when headId does not exist", async () => {
		const response = await request(app)
			.patch(`/api/departments/${departmentId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ headId: uuidv4() });

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_HEAD");
	});
});
