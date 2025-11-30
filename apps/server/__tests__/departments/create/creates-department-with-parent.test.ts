import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/departments - Creates department with parent", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let parentDepartmentId: string;
	let createdDepartmentId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:CREATE", "DEPARTMENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create parent department
		const parentDepartment = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Parent Department ${context.uniqueId}`,
			code: `PARENT${Date.now()}`,
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		parentDepartmentId = String(parentDepartment._id);
	}, 30000);

	afterAll(async () => {
		if (createdDepartmentId) {
			await Department.deleteOne({ _id: createdDepartmentId });
		}
		if (parentDepartmentId) {
			await Department.deleteOne({ _id: parentDepartmentId });
		}
		await context.cleanup();
	});

	it("creates a child department with valid parent", async () => {
		const payload = {
			name: `Child Department ${context.uniqueId}`,
			code: `CHILD${Date.now()}`,
			type: "CLINICAL",
			parentId: parentDepartmentId,
		};

		const response = await request(app)
			.post("/api/departments")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("id");
		expect(response.body.name).toBe(payload.name);
		expect(response.body.code).toBe(payload.code);

		createdDepartmentId = response.body.id;

		// Verify parent relationship in database
		const childDepartment = await Department.findById(createdDepartmentId);
		expect(childDepartment?.parentId).toBe(parentDepartmentId);
	});
});
