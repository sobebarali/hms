import { Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("POST /api/vitals - Validation errors", () => {
	let context: AuthTestContext;
	let accessToken: string;
	let patientId: string;

	beforeAll(async () => {
		context = await createAuthTestContext({
			rolePermissions: ["VITALS:CREATE", "VITALS:READ"],
			includeDepartment: true,
		});
		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		// Create a patient for validation tests
		patientId = uuidv4();
		await Patient.create({
			_id: patientId,
			tenantId: context.hospitalId,
			patientId: `${context.hospitalId}-P-${context.uniqueId}`,
			firstName: "Validation",
			lastName: "TestPatient",
			dateOfBirth: new Date("1990-01-01"),
			gender: "MALE",
			phone: `+1-val-vitals-${context.uniqueId}`,
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

	it("returns 400 when patientId is missing", async () => {
		const payload = {
			temperature: { value: 36.5, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when no vital measurements are provided", async () => {
		const payload = {
			patientId,
			notes: "Just a note",
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when temperature value is below minimum (< 25)", async () => {
		const payload = {
			patientId,
			temperature: { value: 24, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when temperature value is above maximum (> 45)", async () => {
		const payload = {
			patientId,
			temperature: { value: 46, unit: "CELSIUS" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when temperature unit is invalid", async () => {
		const payload = {
			patientId,
			temperature: { value: 36.5, unit: "KELVIN" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when blood pressure systolic is below minimum (< 40)", async () => {
		const payload = {
			patientId,
			bloodPressure: { systolic: 39, diastolic: 80 },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when blood pressure systolic is above maximum (> 300)", async () => {
		const payload = {
			patientId,
			bloodPressure: { systolic: 301, diastolic: 80 },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when blood pressure diastolic is below minimum (< 20)", async () => {
		const payload = {
			patientId,
			bloodPressure: { systolic: 120, diastolic: 19 },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when blood pressure diastolic is above maximum (> 200)", async () => {
		const payload = {
			patientId,
			bloodPressure: { systolic: 120, diastolic: 201 },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when heart rate is below minimum (< 20)", async () => {
		const payload = {
			patientId,
			heartRate: 19,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when heart rate is above maximum (> 300)", async () => {
		const payload = {
			patientId,
			heartRate: 301,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when respiratory rate is below minimum (< 4)", async () => {
		const payload = {
			patientId,
			respiratoryRate: 3,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when respiratory rate is above maximum (> 60)", async () => {
		const payload = {
			patientId,
			respiratoryRate: 61,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when oxygen saturation is below minimum (< 50)", async () => {
		const payload = {
			patientId,
			oxygenSaturation: 49,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when oxygen saturation is above maximum (> 100)", async () => {
		const payload = {
			patientId,
			oxygenSaturation: 101,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when pain level is below minimum (< 0)", async () => {
		const payload = {
			patientId,
			painLevel: -1,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when pain level is above maximum (> 10)", async () => {
		const payload = {
			patientId,
			painLevel: 11,
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when weight unit is invalid", async () => {
		const payload = {
			patientId,
			weight: { value: 70, unit: "STONES" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when height unit is invalid", async () => {
		const payload = {
			patientId,
			height: { value: 175, unit: "FEET" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when blood glucose unit is invalid", async () => {
		const payload = {
			patientId,
			bloodGlucose: { value: 90, unit: "INVALID", timing: "FASTING" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when blood glucose timing is invalid", async () => {
		const payload = {
			patientId,
			bloodGlucose: { value: 90, unit: "MG_DL", timing: "INVALID" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when weight value is not positive", async () => {
		const payload = {
			patientId,
			weight: { value: 0, unit: "KG" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});

	it("returns 400 when height value is not positive", async () => {
		const payload = {
			patientId,
			height: { value: -10, unit: "CM" },
		};

		const response = await request(app)
			.post("/api/vitals")
			.set("Authorization", `Bearer ${accessToken}`)
			.send(payload);

		expect(response.status).toBe(400);
		expect(response.body.code).toBe("INVALID_REQUEST");
	});
});
