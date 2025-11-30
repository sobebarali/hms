import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/departments/:id - Updates department successfully", () => {
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

		// Create test department
		const department = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Update Test ${context.uniqueId}`,
			code: `UPDT${Date.now()}`,
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

	it("updates department successfully", async () => {
		const updatePayload = {
			name: `Updated Name ${context.uniqueId}`,
			description: "Updated description",
			location: "New Building B",
			contactPhone: "+0987654321",
			contactEmail: "updated@hospital.com",
		};

		const response = await request(app)
			.patch(`/api/departments/${departmentId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(updatePayload);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(departmentId);
		expect(response.body.name).toBe(updatePayload.name);
		expect(response.body.description).toBe(updatePayload.description);
		expect(response.body.location).toBe(updatePayload.location);
		expect(response.body).toHaveProperty("updatedAt");
	});
});
