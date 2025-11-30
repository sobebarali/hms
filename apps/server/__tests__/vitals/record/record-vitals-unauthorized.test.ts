import { Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/vitals - Unauthorized", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["PATIENT:READ"], // No VITALS:CREATE permission
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "Unauthorized",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-unauth-vitals-${context.uniqueId}`,
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
	}, 30000);

	afterAll(async () => {
		await Patient.deleteOne({ _id: patientId });
		await context.cleanup();
	});

	it("returns 401 when no authorization header is provided", async () => {
		const payload = {
			patientId,
			temperature: { value: 36.5, unit: "CELSIUS" },
		};

		const response = await request(app).post("/api/vitals").send(payload);

		expect(response.status).toBe(401);
	});

	it("returns 401 when token is invalid", async () => {
		const payload = {
			patientId,
			temperature: { value: 36.5, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", "Bearer invalid-token")
			.send(payload);

		expect(response.status).toBe(401);
	});

	it("returns 403 when user lacks VITALS:CREATE permission", async () => {
		const payload = {
			patientId,
			temperature: { value: 36.5, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(403);
	});
});
