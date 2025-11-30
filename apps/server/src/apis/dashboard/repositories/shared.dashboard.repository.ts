/**
 * Shared dashboard repository
 *
 * Reusable lookups for dashboard data enrichment
 */

import { Patient, Staff } from "@hms/db";

/**
 * Find patients by IDs within a tenant
 */
export async function findPatientsByIds({
	tenantId,
	patientIds,
}: {
	tenantId: string;
	patientIds: string[];
}) {
	if (patientIds.length === 0) {
		return [];
	}

	const patients = await Patient.find({
		_id: { $in: patientIds },
		tenantId,
	}).lean();

	return patients;
}

/**
 * Find staff by IDs within a tenant
 */
export async function findStaffByIds({
	tenantId,
	staffIds,
}: {
	tenantId: string;
	staffIds: string[];
}) {
	if (staffIds.length === 0) {
		return [];
	}

	const staff = await Staff.find({
		_id: { $in: staffIds },
		tenantId,
	}).lean();

	return staff;
}
