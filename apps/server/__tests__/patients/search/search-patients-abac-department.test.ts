import { Department, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/patients/search - ABAC Department-based filtering", () => {
	let doctorContext: AuthTestContext;
	let doctorToken: string;
	let otherDepartmentId: string;
	let orthoPatientId: string;
	let dermPatientId: string;
	const createdPatientIds: string[] = [];

	beforeAll(async () => {
		// Create a doctor with a specific department
		doctorContext = await createAuthTestContext({
			roleName: "DOCTOR",
			rolePermissions: ["PATIENT:CREATE", "PATIENT:READ"],
			includeDepartment: true,
			departmentOverrides: {
				name: "Orthopedics",
				code: "ORTHO",
				type: "CLINICAL",
			},
			staffOverrides: {
				specialization: "Orthopedic Surgeon",
			},
		});
		const doctorTokens = await doctorContext.issuePasswordTokens();
		doctorToken = doctorTokens.accessToken;

		// Create a second department in doctor's hospital
		otherDepartmentId = uuidv4();
		await Department.create({
			_id: otherDepartmentId,
			tenantId: doctorContext.hospitalId,
			name: "Dermatology",
			code: `DERM-${doctorContext.uniqueId}`,
			description: "Dermatology Department",
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create a unique searchable patientId for the ortho patient
		orthoPatientId = `ORTHO-SEARCH-${doctorContext.uniqueId}`;
		dermPatientId = `DERM-SEARCH-${doctorContext.uniqueId}`;

		// Create a patient in doctor's department (Orthopedics)
		const orthoPatient = await Patient.create({
			_id: uuidv4(),
			tenantId: doctorContext.hospitalId,
			patientId: orthoPatientId,
			firstName: "OrthoPatient",
			lastName: "Searchable",
			dateOfBirth: new Date("1988-06-10"),
			gender: "MALE",
			phone: `+1-ortho-${doctorContext.uniqueId}`,
			address: {
				street: "789 Bone St",
				city: "Ortho City",
				state: "OC",
				postalCode: "11111",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Spouse",
				phone: "+1-555-2222",
			},
			patientType: "OPD",
			departmentId: doctorContext.departmentId,
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		createdPatientIds.push(String(orthoPatient._id));

		// Create a patient in the other department (Dermatology)
		// This patient should NOT be visible to the doctor in searches
		const dermPatient = await Patient.create({
			_id: uuidv4(),
			tenantId: doctorContext.hospitalId,
			patientId: dermPatientId,
			firstName: "DermPatient",
			lastName: "Searchable",
			dateOfBirth: new Date("1992-11-25"),
			gender: "FEMALE",
			phone: `+1-derm-${doctorContext.uniqueId}`,
			address: {
				street: "456 Skin Ave",
				city: "Derm City",
				state: "DC",
				postalCode: "22222",
				country: "USA",
			},
			emergencyContact: {
				name: "Emergency Contact",
				relationship: "Parent",
				phone: "+1-555-3333",
			},
			patientType: "IPD",
			departmentId: otherDepartmentId,
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		createdPatientIds.push(String(dermPatient._id));
	}, 60000);

	afterAll(async () => {
		for (const id of createdPatientIds) {
			await Patient.deleteOne({ _id: id });
		}
		await Department.deleteOne({ _id: otherDepartmentId });
		await doctorContext.cleanup();
	});

	it("doctor search only returns patients from their department", async () => {
		// Search by patientId (not encrypted, supports regex)
		// Search for ORTHO patient - should be found
		const orthoResponse = await request(app)
			.get("/api/patients/search")
			.set("Authorization", `Bearer ${doctorToken}`)
			.query({ q: orthoPatientId, type: "id" });

		expect(orthoResponse.status).toBe(200);
		expect(orthoResponse.body.results.length).toBe(1);
		expect(orthoResponse.body.results[0].patientId).toBe(orthoPatientId);

		// Search for DERM patient - should NOT be found (different department)
		const dermResponse = await request(app)
			.get("/api/patients/search")
			.set("Authorization", `Bearer ${doctorToken}`)
			.query({ q: dermPatientId, type: "id" });

		expect(dermResponse.status).toBe(200);
		expect(dermResponse.body.results.length).toBe(0);
	});

	it("doctor general search is restricted to their department", async () => {
		// Search using the unique ID that both patients share
		const response = await request(app)
			.get("/api/patients/search")
			.set("Authorization", `Bearer ${doctorToken}`)
			.query({ q: doctorContext.uniqueId });

		expect(response.status).toBe(200);

		// Only ortho patient should be found
		const orthoPatients = response.body.results.filter(
			(p: { patientId: string }) => p.patientId.includes("ORTHO"),
		);
		const dermPatients = response.body.results.filter(
			(p: { patientId: string }) => p.patientId.includes("DERM"),
		);

		expect(orthoPatients.length).toBe(1);
		expect(dermPatients.length).toBe(0);
	});
});
