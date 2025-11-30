import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/departments/:id - Returns 409 for duplicate name", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;
	let otherDepartmentId: string;
	let existingName: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:UPDATE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		existingName = `Existing Name ${context.uniqueId}`;

		// Create first department with the name we'll try to use
		const otherDepartment = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: existingName,
			code: `OTHER${Date.now()}`,
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		otherDepartmentId = String(otherDepartment._id);

		// Create the department we'll update
		const department = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Original Name ${context.uniqueId}`,
			code: `ORIG${Date.now()}`,
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
		if (otherDepartmentId) {
			await Department.deleteOne({ _id: otherDepartmentId });
		}
		await context.cleanup();
	});

	it("returns 409 when trying to update to an existing name", async () => {
		const response = await request(app)
			.patch(`/api/departments/${departmentId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send({ name: existingName });

		expect(response.status).toBe(409);
		expect(response.body.code).toBe("NAME_EXISTS");
	});
});
