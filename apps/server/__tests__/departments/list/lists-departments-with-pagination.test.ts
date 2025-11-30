import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/departments - Lists departments with pagination", () => {
	let context: AuthTestContext;
	let accessToken: string;
	const createdDepartmentIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create 5 test departments
		for (let i = 0; i < 5; i++) {
			const department = await Department.create({
				_id: uuidv4(),
				tenantId: context.hospitalId,
				name: `Pagination Test ${i} ${context.uniqueId}`,
				code: `PAGE${i}${Date.now()}`,
				type: "CLINICAL",
				status: "ACTIVE",
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			createdDepartmentIds.push(String(department._id));
		}
	}, 30000);

	afterAll(async () => {
		for (const id of createdDepartmentIds) {
			await Department.deleteOne({ _id: id });
		}
		await context.cleanup();
	});

	it("returns paginated results with correct page and limit", async () => {
		const response = await request(app)
			.get("/api/departments")
			.query({ page: 1, limit: 2 })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(Number(response.body.pagination.page)).toBe(1);
		expect(Number(response.body.pagination.limit)).toBe(2);
		expect(response.body.data.length).toBeLessThanOrEqual(2);
	});

	it("returns second page correctly", async () => {
		const response = await request(app)
			.get("/api/departments")
			.query({ page: 2, limit: 2 })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(Number(response.body.pagination.page)).toBe(2);
	});
});
