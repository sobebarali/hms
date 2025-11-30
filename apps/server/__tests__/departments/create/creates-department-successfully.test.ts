import { Department } from "@hms/db";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/departments - Creates department successfully", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let createdDepartmentId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:CREATE", "DEPARTMENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;
	}, 30000);

	afterAll(async () => {
		if (createdDepartmentId) {
			await Department.deleteOne({ _id: createdDepartmentId });
		}
		await context.cleanup();
	});

	it("creates a new department successfully", async () => {
		const payload = {
			name: `Cardiology ${context.uniqueId}`,
			code: `CARD${context.uniqueId.slice(0, 8).toUpperCase()}`,
			description: "Heart and cardiovascular care",
			type: "CLINICAL",
			location: "Building A, Floor 3",
			contactPhone: "+1234567890",
			contactEmail: `cardiology-${context.uniqueId}@hospital.com`,
			operatingHours: {
				monday: { start: "08:00", end: "17:00" },
				tuesday: { start: "08:00", end: "17:00" },
				wednesday: { start: "08:00", end: "17:00" },
				thursday: { start: "08:00", end: "17:00" },
				friday: { start: "08:00", end: "17:00" },
			},
		};

		const response = await request(app)
			.post("/api/departments")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("id");
		expect(response.body.name).toBe(payload.name);
		expect(response.body.code).toBe(payload.code);
		expect(response.body.type).toBe("CLINICAL");
		expect(response.body.status).toBe("ACTIVE");
		expect(response.body).toHaveProperty("createdAt");

		createdDepartmentId = response.body.id;
	});
});
