import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/vitals/:id - Validation errors", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let vitalsId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["VITALS:CREATE", "VITALS:READ", "VITALS:UPDATE"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a patient
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-val-${context.uniqueId}`,
			firstName: "Validation",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-val-update-${context.uniqueId}`,
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
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create vitals for the patient
		const createResponse = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send({
				patientId,
				temperature: { value: 36.5, unit: "CELSIUS" },
			});

		vitalsId = createResponse.body.id;
	}, 30000);

	afterAll(async () => {
		await Vitals.deleteOne({ _id: vitalsId });
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("returns 400 when correctionReason is missing", async () => {
		const payload = {
			notes: "Updated notes",
		};

		const response = await request(app)
			.patch(`/api/vitals/${vitalsId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when correctionReason is empty string", async () => {
		const payload = {
			notes: "Updated notes",
			correctionReason: "",
		};

		const response = await request(app)
			.patch(`/api/vitals/${vitalsId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});
});
