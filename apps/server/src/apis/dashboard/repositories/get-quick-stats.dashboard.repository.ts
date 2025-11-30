/**
 * Quick stats repository
 *
 * Database queries for header quick stats
 */

import {
	Appointment,
	AppointmentStatus,
	Prescription,
	PrescriptionStatus,
	Vitals,
} from "@hms/db";

export async function getDoctorPendingTasks({
	tenantId,
	doctorId,
}: {
	tenantId: string;
	doctorId: string;
}) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return Appointment.countDocuments({
		tenantId,
		doctorId,
		date: { $gte: today },
		status: {
			$in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CHECKED_IN],
		},
	});
}

export async function getPharmacistPendingTasks({
	tenantId,
}: {
	tenantId: string;
}) {
	return Prescription.countDocuments({
		tenantId,
		status: PrescriptionStatus.PENDING,
	});
}

export async function getNurseAlerts({ tenantId }: { tenantId: string }) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return Vitals.countDocuments({
		tenantId,
		recordedAt: { $gte: today },
		"alerts.severity": { $in: ["HIGH", "CRITICAL"] },
	});
}

export async function getReceptionistPendingTasks({
	tenantId,
}: {
	tenantId: string;
}) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	return Appointment.countDocuments({
		tenantId,
		date: { $gte: today, $lt: tomorrow },
		status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
	});
}
