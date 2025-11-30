import { Prescription } from "@hms/db";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/index";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "../../helpers/auth-test-context";

describe("GET /api/dashboard/quick-stats - Pharmacist stats", () => {
	let context: AuthTestContext;
	let accessToken: string;
	const prescriptionIds: string[] = [];

	beforeAll(async () => {
		context = await createAuthTestContext({
			roleName: "PHARMACIST",
			rolePermissions: [
				"DASHBOARD:VIEW",
				"PRESCRIPTION:READ",
				"DISPENSING:READ",
				"DISPENSING:CREATE",
			],
			includeDepartment: true,
		});

		const tokens = await context.issuePasswordTokens();
		accessToken = tokens.accessToken;

		const now = new Date();

		// Create pending prescriptions to test pending tasks count
		for (let i = 0; i < 3; i++) {
			const prescriptionId = uuidv4();
			prescriptionIds.push(prescriptionId);

			await Prescription.create({
				_id: prescriptionId,
				tenantId: context.hospitalId,
				prescriptionId: `PRESC-${context.uniqueId}-${i}`,
				patientId: uuidv4(),
				doctorId: context.staffId,
				status: "PENDING",
				medicines: [
					{
						name: `Test Medication ${i}`,
						dosage: "10mg",
						frequency: "Once daily",
						duration: "7 days",
						quantity: 7,
					},
				],
				diagnosis: "Test diagnosis",
				createdAt: now,
				updatedAt: now,
			});
		}
	}, 30000);

	afterAll(async () => {
		for (const id of prescriptionIds) {
			await Prescription.deleteOne({ _id: id });
		}
		await context.cleanup();
	});

	it("returns quick stats with pending prescriptions for pharmacist", async () => {
		const response = await request(app)
			.get("/api/dashboard/quick-stats")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toHaveProperty("pendingTasks");
		expect(response.body.data.pendingTasks).toBeGreaterThanOrEqual(3);
	});

	it("returns quick stats with correct structure", async () => {
		const response = await request(app)
			.get("/api/dashboard/quick-stats")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty("notifications");
		expect(response.body.data).toHaveProperty("pendingTasks");
		expect(response.body.data).toHaveProperty("alerts");
	});
});
