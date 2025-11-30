import { Patient, Vitals } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("PATCH /api/vitals/:id - Record too old", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;
	let oldVitalsId: string;

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
			patientId: `${context.hospitalId}-P-old-${context.uniqueId}`,
			firstName: "Old",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-old-${context.uniqueId}`,
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

		// Create vitals directly in DB with old recordedAt date (more than 24 hours ago)
		const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
		oldVitalsId = uuidv4();
		await Vitals.create({
			_id: oldVitalsId,
			tenantId: context.hospitalId,
			patientId,
			temperature: { value: 36.5, unit: "CELSIUS" },
			recordedBy: context.staffId,
			recordedAt: oldDate,
			alerts: [],
			createdAt: oldDate,
			updatedAt: oldDate,
		});
	}, 30000);

	afterAll(async () => {
		await Vitals.deleteOne({ _id: oldVitalsId });
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("returns 400 when trying to update record older than 24 hours", async () => {
		const payload = {
			notes: "Updated notes",
			correctionReason: "Trying to update old record",
		};

		const response = await request(app)
			.patch(`/api/vitals/${oldVitalsId}`)
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("RECORD_TOO_OLD");
	});
});
