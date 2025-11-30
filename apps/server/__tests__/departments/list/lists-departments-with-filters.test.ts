import { Department } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/departments - Lists departments with filters", () => {
	let context: AuthTestContext;
	let accessToken: string;
	const createdDepartmentIds: string[] = [];
	let searchableName: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:READ"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		searchableName = `Searchable Radiology ${context.uniqueId}`;

		// Create departments with different types
		const clinicalDept = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: searchableName,
			code: `SRCH${Date.now()}`,
			type: "DIAGNOSTIC",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		createdDepartmentIds.push(String(clinicalDept._id));

		const adminDept = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Admin Filter Test ${context.uniqueId}`,
			code: `ADMIN${Date.now()}`,
			type: "ADMINISTRATIVE",
			status: "INACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		createdDepartmentIds.push(String(adminDept._id));
	}, 30000);

	afterAll(async () => {
		for (const id of createdDepartmentIds) {
			await Department.deleteOne({ _id: id });
		}
		await context.cleanup();
	});

	it("filters departments by type", async () => {
		const response = await request(app)
			.get("/api/departments")
			.query({ type: "DIAGNOSTIC" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(
			response.body.data.every(
				(d: { type: string }) => d.type === "DIAGNOSTIC",
			),
		).toBe(true);
	});

	it("filters departments by status", async () => {
		const response = await request(app)
			.get("/api/departments")
			.query({ status: "INACTIVE" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(
			response.body.data.every(
				(d: { status: string }) => d.status === "INACTIVE",
			),
		).toBe(true);
	});

	it("searches departments by name", async () => {
		const response = await request(app)
			.get("/api/departments")
			.query({ search: "Searchable Radiology" })
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThanOrEqual(1);
		expect(
			response.body.data.some((d: { name: string }) =>
				d.name.includes("Searchable Radiology"),
			),
		).toBe(true);
	});
});
