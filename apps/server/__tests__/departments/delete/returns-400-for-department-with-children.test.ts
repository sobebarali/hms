import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/departments/:id - Returns 400 for department with children", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let parentDepartmentId: string;
	let childDepartmentId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:DELETE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create parent department
		const parentDepartment = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Parent Dept ${context.uniqueId}`,
			code: `PRNT${Date.now()}`,
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		parentDepartmentId = String(parentDepartment._id);

		// Create child department
		const childDepartment = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Child Dept ${context.uniqueId}`,
			code: `CHLD${Date.now()}`,
			type: "CLINICAL",
			parentId: parentDepartmentId,
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		childDepartmentId = String(childDepartment._id);
	}, 30000);

	afterAll(async () => {
		if (childDepartmentId) {
			await Department.deleteOne({ _id: childDepartmentId });
		}
		if (parentDepartmentId) {
			await Department.deleteOne({ _id: parentDepartmentId });
		}
		await context.cleanup();
	});

	it("returns 400 when department has child departments", async () => {
		const response = await request(app)
			.delete(`/api/departments/${parentDepartmentId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("HAS_CHILDREN");
	});
});
