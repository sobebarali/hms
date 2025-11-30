import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/departments/:id - Retrieves department by ID", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create test department
		const department = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Get By ID Test ${context.uniqueId}`,
			code: `GETID${Date.now()}`,
			description: "Test department for get by ID",
			type: "CLINICAL",
			location: "Building A",
			contact: {
				phone: "+1234567890",
				email: "dept@test.com",
			},
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

	it("retrieves department details successfully", async () => {
		const response = await request(app)
			.get(`/api/departments/${departmentId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(departmentId);
		expect(response.body.name).toContain("Get By ID Test");
		expect(response.body.type).toBe("CLINICAL");
		expect(response.body.status).toBe("ACTIVE");
		expect(response.body).toHaveProperty("staffCount");
		expect(response.body).toHaveProperty("children");
		expect(response.body).toHaveProperty("createdAt");
		expect(response.body).toHaveProperty("updatedAt");
	});
});
