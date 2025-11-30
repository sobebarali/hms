import { Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/vitals - Patient inactive", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let inactivePatientId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["VITALS:CREATE", "VITALS:READ"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create an inactive patient
		inactivePatientId = uuidv4();
		await Patient.create({
			_id: inactivePatientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-inactive-${context.uniqueId}`,
			firstName: "Inactive",
			lastName: "Patient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-inactive-${context.uniqueId}`,
			address: {
				street: "123 Test St",
				city: "Test City",
				state: "TS",
				postalCode: "12345",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Spouse",
				phone: "+1-555-0000",
			},
			patientType: "OPD",
			status: "INACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}, 30000);

	afterAll(async () => {
		await Patient.deleteOne({ _id: inactivePatientId });
		await context.cleanup();
	});

	it("returns 400 when patient status is not ACTIVE", async () => {
		const payload = {
			patientId: inactivePatientId,
			temperature: { value: 36.5, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("PATIENT_INACTIVE");
	});
});
