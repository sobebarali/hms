import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/departments - Returns 409 for duplicate name", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let existingDepartmentId: string;
	let departmentName: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:CREATE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		departmentName = `Duplicate Name Test ${context.uniqueId}`;

		// Create existing department with the name
		const existingDepartment = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: departmentName,
			code: `EXIST${Date.now()}`,
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		existingDepartmentId = String(existingDepartment._id);
	}, 30000);

	afterAll(async () => {
		if (existingDepartmentId) {
			await Department.deleteOne({ _id: existingDepartmentId });
		}
		await context.cleanup();
	});

	it("returns 409 when department name already exists", async () => {
		const payload = {
			name: departmentName,
			code: `NEW${Date.now()}`,
			type: "ADMINISTRATIVE",
		};

		const response = await request(app)
			.post("/api/departments")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(409);
		expect(response.body.code).toBe("NAME_EXISTS");
	});
});
