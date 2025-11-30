import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/vitals/:id - Update vitals success", () => {
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
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "Update",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-update-${context.uniqueId}`,
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
				notes: "Original notes",
			});

		vitalsId = createResponse.body.id;
	}, 30000);

	afterAll(async () => {
		await Vitals.deleteOne({ _id: vitalsId });
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("updates vitals notes with correction reason successfully", async () => {
		const payload = {
			notes: "Updated notes with additional observations",
			correctionReason: "Added missing observations from initial assessment",
		};

		const response = await request(app)
			.patch(`/api/vitals/${vitalsId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(vitalsId);
		expect(response.body.patientId).toBe(patientId);
		expect(response.body.notes).toBe(
			"Updated notes with additional observations",
		);
		expect(response.body.correctionReason).toBe(
			"Added missing observations from initial assessment",
		);
		expect(response.body).toHaveProperty("updatedAt");
	});

	it("updates vitals notes to empty string with correction reason", async () => {
		const payload = {
			notes: "",
			correctionReason: "Removed incorrect notes",
		};

		const response = await request(app)
			.patch(`/api/vitals/${vitalsId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(200);
		expect(response.body.notes).toBe("");
	});
});
