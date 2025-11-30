import { Department, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("DELETE /api/departments/:id - Returns 400 for department with patients", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let departmentId: string;
	let patientId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["DEPARTMENT:DELETE"],
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create test department
		const department = await Department.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			name: `Dept With Patients ${context.uniqueId}`,
			code: `PAT${Date.now()}`,
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		departmentId = String(department._id);

		// Create a patient assigned to this department
		const patient = await Patient.create({
			_id: uuidv4(),
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${Date.now()}`,
			firstName: "Test",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-15"),
			gender: "MALE",
			phone: `+1-${context.uniqueId}`,
			patientType: "OPD",
			departmentId: departmentId,
			status: "ACTIVE",
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Spouse",
				phone: "+1-555-0000",
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		patientId = String(patient._id);
	}, 30000);

	afterAll(async () => {
		if (patientId) {
			await Patient.deleteOne({ _id: patientId });
		}
		if (departmentId) {
			await Department.deleteOne({ _id: departmentId });
		}
		await context.cleanup();
	});

	it("returns 400 when department has active patients", async () => {
		const response = await request(app)
			.delete(`/api/departments/${departmentId}`)
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("HAS_ACTIVE_PATIENTS");
	});
});
