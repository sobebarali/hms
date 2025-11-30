import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/departments - Lists departments successfully", () => {
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

		// Create test departments
		for (let i = 0; i < 3; i++) {
			const department = await Department.create({
				_id: uuidv4(),
				tenantId: context.hospitalId,
				name: `List Test Department ${i} ${context.uniqueId}`,
				code: `LIST${i}${Date.now()}`,
				type: i % 2 === 0 ? "CLINICAL" : "ADMINISTRATIVE",
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

	it("lists departments successfully", async () => {
		const response = await request(app)
			.get("/api/departments")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body).toHaveProperty("pagination");
		expect(Array.isArray(response.body.data)).toBe(true);
		expect(response.body.data.length).toBeGreaterThanOrEqual(3);
		expect(response.body.pagination).toHaveProperty("page");
		expect(response.body.pagination).toHaveProperty("limit");
		expect(response.body.pagination).toHaveProperty("total");
		expect(response.body.pagination).toHaveProperty("totalPages");
	});
});
