import { Department, Patient } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/patients - ABAC Department-based filtering for doctors", () => {
	let doctorContext: AuthTestContext;
	let doctorToken: string;
	let otherDepartmentId: string;
	const createdPatientIds: string[] = [];

	beforeAll(async () => {
		// Create a doctor with a specific department
		doctorContext = await createAuthTestContext({
			roleName: "DOCTOR",
			rolePermissions: ["PATIENT:CREATE", "PATIENT:READ"],
			includeDepartment: true,
			departmentOverrides: {
				name: "Cardiology",
				code: "CARDIO",
				type: "CLINICAL",
			},
			staffOverrides: {
				specialization: "Cardiologist",
			},
		});
		const doctorTokens = await doctorContext.issuePasswordTokens();
		doctorToken = doctorTokens.accessToken;

		// Create a second department in doctor's hospital
		otherDepartmentId = uuidv4();
		await Department.create({
			_id: otherDepartmentId,
			tenantId: doctorContext.hospitalId,
			name: "Neurology",
			code: `NEURO-${doctorContext.uniqueId}`,
			description: "Neurology Department",
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create patients in doctor's department (Cardiology)
		for (let i = 0; i < 2; i++) {
			const payload = {
				firstName: `CardioPatient${i}`,
				lastName: `Test${i}`,
				dateOfBirth: "1985-03-20T00:00:00.000Z",
				gender: "MALE",
				phone: `+1-cardio-${doctorContext.uniqueId}-${i}`,
				address: {
					street: "123 Heart St",
					city: "Cardio City",
					state: "CC",
					postalCode: "12345",
					country: "USA",
				},
				emergencyContact: {
					name: "Emergency Contact",
					relationship: "Family",
					phone: "+1-555-0000",
				},
				patientType: "OPD",
				department: doctorContext.departmentId,
			};

			const response = await request(app)
				.post("/api/patients")
				.set("Authorization", `Bearer ${doctorToken}`)
				.send(payload);

			if (response.body.id) {
				createdPatientIds.push(response.body.id);
			}
		}

		// Directly create patients in the other department (Neurology) in DB
		// These patients should NOT be visible to the doctor
		for (let i = 0; i < 2; i++) {
			const patient = await Patient.create({
				_id: uuidv4(),
				tenantId: doctorContext.hospitalId,
				patientId: `NEURO-${doctorContext.uniqueId}-${i}`,
				firstName: `NeuroPatient${i}`,
				lastName: `Test${i}`,
				dateOfBirth: new Date("1990-07-15"),
				gender: "FEMALE",
				phone: `+1-neuro-${doctorContext.uniqueId}-${i}`,
				address: {
					street: "456 Brain Ave",
					city: "Neuro City",
					state: "NC",
					postalCode: "67890",
					country: "USA",
				},
				emergencyContact: {
					name: "Emergency Contact",
					relationship: "Family",
					phone: "+1-555-1111",
				},
				patientType: "IPD",
				departmentId: otherDepartmentId,
				status: "ACTIVE",
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			createdPatientIds.push(String(patient._id));
		}
	}, 60000);

	afterAll(async () => {
		for (const id of createdPatientIds) {
			await Patient.deleteOne({ _id: id });
		}
		await Department.deleteOne({ _id: otherDepartmentId });
		await doctorContext.cleanup();
	});

	it("doctor can only see patients in their department", async () => {
		const response = await request(app)
			.get("/api/patients")
			.set("Authorization", `Bearer ${doctorToken}`)
			.query({ page: 1, limit: 50 });

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThan(0);

		// All patients returned should be from doctor's department (Cardiology)
		for (const patient of response.body.data) {
			expect(patient.department).toBe("Cardiology");
		}

		// Should not include patients from Neurology
		const neuroPatients = response.body.data.filter(
			(p: { department: string }) => p.department === "Neurology",
		);
		expect(neuroPatients.length).toBe(0);
	});

	it("doctor cannot filter by a different department", async () => {
		const response = await request(app)
			.get("/api/patients")
			.set("Authorization", `Bearer ${doctorToken}`)
			.query({ department: otherDepartmentId });

		expect(response.status).toBe(403);
		expect(response.body.code).toBe("DEPARTMENT_ACCESS_DENIED");
	});

	it("doctor can filter by their own department explicitly", async () => {
		const response = await request(app)
			.get("/api/patients")
			.set("Authorization", `Bearer ${doctorToken}`)
			.query({ department: doctorContext.departmentId });

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThan(0);

		// All returned patients should be from Cardiology
		for (const patient of response.body.data) {
			expect(patient.department).toBe("Cardiology");
		}
	});
});

describe("GET /api/patients - ABAC Admin bypasses department restriction", () => {
	let adminContext: AuthTestContext;
	let adminToken: string;
	let dept1Id: string;
	let dept2Id: string;
	const createdPatientIds: string[] = [];

	beforeAll(async () => {
		// Create an admin (HOSPITAL_ADMIN bypasses ABAC)
		adminContext = await createAuthTestContext({
			roleName: "HOSPITAL_ADMIN",
			rolePermissions: ["PATIENT:CREATE", "PATIENT:READ", "PATIENT:MANAGE"],
			includeDepartment: true,
			departmentOverrides: {
				name: "Administration",
				code: "ADMIN",
				type: "ADMINISTRATIVE",
			},
		});
		const adminTokens = await adminContext.issuePasswordTokens();
		adminToken = adminTokens.accessToken;

		// Admin's own department
		if (!adminContext.departmentId) {
			throw new Error("Admin department ID is required for this test");
		}
		dept1Id = adminContext.departmentId;

		// Create a second department
		dept2Id = uuidv4();
		await Department.create({
			_id: dept2Id,
			tenantId: adminContext.hospitalId,
			name: "Emergency",
			code: `ER-${adminContext.uniqueId}`,
			description: "Emergency Department",
			type: "CLINICAL",
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create patients in department 1 (Administration)
		const patient1 = await Patient.create({
			_id: uuidv4(),
			tenantId: adminContext.hospitalId,
			patientId: `ADMIN-${adminContext.uniqueId}-1`,
			firstName: "AdminPatient",
			lastName: "One",
			dateOfBirth: new Date("1980-01-01"),
			gender: "MALE",
			phone: `+1-admin-${adminContext.uniqueId}-1`,
			address: {
				street: "100 Admin St",
				city: "Admin City",
				state: "AC",
				postalCode: "11111",
				country: "USA",
			},
			emergencyContact: {
				name: "Contact",
				relationship: "Family",
				phone: "+1-555-0000",
			},
			patientType: "OPD",
			departmentId: dept1Id,
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		createdPatientIds.push(String(patient1._id));

		// Create patients in department 2 (Emergency)
		const patient2 = await Patient.create({
			_id: uuidv4(),
			tenantId: adminContext.hospitalId,
			patientId: `ER-${adminContext.uniqueId}-1`,
			firstName: "ERPatient",
			lastName: "One",
			dateOfBirth: new Date("1985-06-15"),
			gender: "FEMALE",
			phone: `+1-er-${adminContext.uniqueId}-1`,
			address: {
				street: "200 ER Ave",
				city: "ER City",
				state: "EC",
				postalCode: "22222",
				country: "USA",
			},
			emergencyContact: {
				name: "Contact",
				relationship: "Spouse",
				phone: "+1-555-1111",
			},
			patientType: "IPD",
			departmentId: dept2Id,
			status: "ACTIVE",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		createdPatientIds.push(String(patient2._id));
	}, 60000);

	afterAll(async () => {
		for (const id of createdPatientIds) {
			await Patient.deleteOne({ _id: id });
		}
		await Department.deleteOne({ _id: dept2Id });
		await adminContext.cleanup();
	});

	it("admin can see patients from all departments", async () => {
		const response = await request(app)
			.get("/api/patients")
			.set("Authorization", `Bearer ${adminToken}`)
			.query({ page: 1, limit: 50 });

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThanOrEqual(2);

		// Admin should see patients from multiple departments
		const departments = new Set(
			response.body.data.map((p: { department: string }) => p.department),
		);
		expect(departments.size).toBeGreaterThanOrEqual(2);
	});

	it("admin can filter by any department", async () => {
		// Filter by Emergency department
		const response = await request(app)
			.get("/api/patients")
			.set("Authorization", `Bearer ${adminToken}`)
			.query({ department: dept2Id });

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThan(0);

		// All returned patients should be from the Emergency department
		for (const patient of response.body.data) {
			expect(patient.department).toBe("Emergency");
		}
	});
});
