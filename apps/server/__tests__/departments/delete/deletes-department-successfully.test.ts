import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/departments/:id - Deletes department successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:DELETE"],
			createStaff: false,
		});

		// Create a separate context with staff for auth
		const authContext = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:DELETE"],
		});
		const tokens = await authContext.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create test department (in authContext's tenant)
		const department = await Department.create({
			_id: uuidv4(),
			tenantId: authContext.hospitalId,
			name: `Delete Test ${authContext.uniqueId}`,
			code: `DEL${Date.now()}`,
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		departmentId = String(department._id);

		// Store authContext for cleanup
		context = authContext;
	}, 30000);

	afterAll(async () => {
		if (departmentId) {
			await Department.deleteOne({ _id: departmentId });
		}
		await context.cleanup();
	});

	it("deactivates department successfully", async () => {
		const response = await request(app)
			.delete(`/api/departments/${departmentId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(departmentId);
		expect(response.body.status).toBe("INACTIVE");
		expect(response.body).toHaveProperty("deactivatedAt");
	});
});
