import { Department } from "@hms/db";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/departments/tree - Retrieves department tree", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let parentDepartmentId: string;
	let childDepartmentId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create parent department
		const parentDept = await Department.create({
			_id: `dept-parent-${context.uniqueId}`,
			tenantId: context.hospitalId,
			name: `Parent Department ${context.uniqueId}`,
			code: `PAR${context.uniqueId}`
				.toUpperCase()
				.replace(/-/g, "")
				.slice(0, 10),
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		parentDepartmentId = String(parentDept._id);

		// Create child department
		const childDept = await Department.create({
			_id: `dept-child-${context.uniqueId}`,
			tenantId: context.hospitalId,
			name: `Child Department ${context.uniqueId}`,
			code: `CHD${context.uniqueId}`
				.toUpperCase()
				.replace(/-/g, "")
				.slice(0, 10),
			type: "CLINICAL",
			status: "ACTIVE",
			parentId: parentDepartmentId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		childDepartmentId = String(childDept._id);
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

	it("retrieves department tree with hierarchy", async () => {
		const response = await request(app)
			.get("/api/departments/tree")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("tree");
		expect(Array.isArray(response.body.tree)).toBe(true);

		// Find the parent department in the tree
		const parentNode = response.body.tree.find(
			(node: { id: string }) => node.id === parentDepartmentId,
		);
		expect(parentNode).toBeDefined();
		expect(parentNode.name).toContain("Parent Department");
		expect(parentNode.children).toBeDefined();
		expect(Array.isArray(parentNode.children)).toBe(true);

		// Find the child department in the parent's children
		const childNode = parentNode.children.find(
			(node: { id: string }) => node.id === childDepartmentId,
		);
		expect(childNode).toBeDefined();
		expect(childNode.name).toContain("Child Department");
	});
});
