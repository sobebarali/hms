/**
 * Dashboard repository
 *
 * Database aggregation queries for dashboard statistics
 */

import {
	Admission,
	AdmissionStatus,
	Appointment,
	AppointmentStatus,
	Dispensing,
	DispensingStatus,
	Patient,
	PatientStatus,
	PatientType,
	Prescription,
	PrescriptionStatus,
	Staff,
	StaffStatus,
	Vitals,
} from "@hms/db";
import {
	DEFAULT_BED_CAPACITY,
	ESTIMATED_WAIT_TIMES,
} from "../dashboard.constants";

// Helper to get today's date range
// TODO: This should use the hospital's timezone from configuration
// Currently uses server's local timezone which may cause incorrect date boundaries
// for hospitals in different timezones
function getTodayRange() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	return { today, tomorrow };
}

// ==================== Hospital Admin Queries ====================

export async function getOverviewStats({ tenantId }: { tenantId: string }) {
	const { today, tomorrow } = getTodayRange();

	const [
		totalPatients,
		activePatients,
		opdToday,
		ipdCurrent,
		appointmentsToday,
		prescriptionsToday,
	] = await Promise.all([
		Patient.countDocuments({ tenantId }),
		Patient.countDocuments({ tenantId, status: PatientStatus.ACTIVE }),
		Patient.countDocuments({
			tenantId,
			patientType: PatientType.OPD,
			createdAt: { $gte: today, $lt: tomorrow },
		}),
		Patient.countDocuments({
			tenantId,
			patientType: PatientType.IPD,
			status: PatientStatus.ACTIVE,
		}),
		Appointment.countDocuments({
			tenantId,
			date: { $gte: today, $lt: tomorrow },
		}),
		Prescription.countDocuments({
			tenantId,
			createdAt: { $gte: today, $lt: tomorrow },
		}),
	]);

	return {
		totalPatients,
		activePatients,
		opdToday,
		ipdCurrent,
		appointmentsToday,
		prescriptionsToday,
	};
}

export async function getPatientStats({ tenantId }: { tenantId: string }) {
	const now = new Date();
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const [newThisWeek, newThisMonth, byType, byDepartment, trend] =
		await Promise.all([
			Patient.countDocuments({ tenantId, createdAt: { $gte: weekAgo } }),
			Patient.countDocuments({ tenantId, createdAt: { $gte: monthAgo } }),
			getPatientsByType({ tenantId }),
			getPatientsByDepartment({ tenantId }),
			getDailyPatientTrend({ tenantId, days: 7 }),
		]);

	return { newThisWeek, newThisMonth, byType, byDepartment, trend };
}

export async function getAppointmentStatsForAdmin({
	tenantId,
}: {
	tenantId: string;
}) {
	const { today, tomorrow } = getTodayRange();

	const [
		todayCount,
		completed,
		pending,
		cancelled,
		noShow,
		byDepartment,
		trend,
	] = await Promise.all([
		Appointment.countDocuments({
			tenantId,
			date: { $gte: today, $lt: tomorrow },
		}),
		Appointment.countDocuments({
			tenantId,
			date: { $gte: today, $lt: tomorrow },
			status: AppointmentStatus.COMPLETED,
		}),
		Appointment.countDocuments({
			tenantId,
			date: { $gte: today, $lt: tomorrow },
			status: {
				$in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
			},
		}),
		Appointment.countDocuments({
			tenantId,
			date: { $gte: today, $lt: tomorrow },
			status: AppointmentStatus.CANCELLED,
		}),
		Appointment.countDocuments({
			tenantId,
			date: { $gte: today, $lt: tomorrow },
			status: AppointmentStatus.NO_SHOW,
		}),
		getAppointmentsByDepartment({ tenantId }),
		getDailyAppointmentTrend({ tenantId, days: 7 }),
	]);

	return {
		today: todayCount,
		completed,
		pending,
		cancelled,
		noShow,
		byDepartment,
		trend,
	};
}

export async function getStaffStats({ tenantId }: { tenantId: string }) {
	const { today } = getTodayRange();

	const [totalActive, byRole, onDutyToday] = await Promise.all([
		Staff.countDocuments({ tenantId, status: StaffStatus.ACTIVE }),
		getStaffByRole({ tenantId }),
		Staff.countDocuments({
			tenantId,
			status: StaffStatus.ACTIVE,
			lastLogin: { $gte: today },
		}),
	]);

	return { totalActive, byRole, onDutyToday };
}

// ==================== Doctor Queries ====================

export async function getDoctorTodayStats({
	tenantId,
	doctorId,
}: {
	tenantId: string;
	doctorId: string;
}) {
	const { today, tomorrow } = getTodayRange();

	const [total, completed, currentPatient, nextPatient] = await Promise.all([
		Appointment.countDocuments({
			tenantId,
			doctorId,
			date: { $gte: today, $lt: tomorrow },
		}),
		Appointment.countDocuments({
			tenantId,
			doctorId,
			date: { $gte: today, $lt: tomorrow },
			status: AppointmentStatus.COMPLETED,
		}),
		Appointment.findOne({
			tenantId,
			doctorId,
			date: { $gte: today, $lt: tomorrow },
			status: AppointmentStatus.IN_PROGRESS,
		}).lean(),
		Appointment.findOne({
			tenantId,
			doctorId,
			date: { $gte: today, $lt: tomorrow },
			status: AppointmentStatus.CHECKED_IN,
		})
			.sort({ queueNumber: 1 })
			.lean(),
	]);

	return {
		totalAppointments: total,
		completed,
		remaining: total - completed,
		currentPatient,
		nextPatient,
	};
}

export async function getDoctorAppointments({
	tenantId,
	doctorId,
}: {
	tenantId: string;
	doctorId: string;
}) {
	const { today, tomorrow } = getTodayRange();

	const [upcoming, todaySchedule, pendingFollowUps] = await Promise.all([
		Appointment.find({
			tenantId,
			doctorId,
			date: { $gte: today },
			status: {
				$in: [
					AppointmentStatus.SCHEDULED,
					AppointmentStatus.CONFIRMED,
					AppointmentStatus.CHECKED_IN,
				],
			},
		})
			.sort({ date: 1, "timeSlot.start": 1 })
			.limit(5)
			.lean(),
		Appointment.find({
			tenantId,
			doctorId,
			date: { $gte: today, $lt: tomorrow },
		})
			.sort({ "timeSlot.start": 1 })
			.lean(),
		Appointment.countDocuments({
			tenantId,
			doctorId,
			followUpRequired: true,
			followUpDate: { $lte: tomorrow },
			status: { $ne: AppointmentStatus.COMPLETED },
		}),
	]);

	return { upcoming, todaySchedule, pendingFollowUps };
}

export async function getDoctorPatients({
	tenantId,
	doctorId,
}: {
	tenantId: string;
	doctorId: string;
}) {
	const { today, tomorrow } = getTodayRange();

	const [totalAssigned, seenToday, recentPatients] = await Promise.all([
		Patient.countDocuments({ tenantId, assignedDoctorId: doctorId }),
		Appointment.countDocuments({
			tenantId,
			doctorId,
			date: { $gte: today, $lt: tomorrow },
			status: AppointmentStatus.COMPLETED,
		}),
		Patient.find({ tenantId, assignedDoctorId: doctorId })
			.sort({ updatedAt: -1 })
			.limit(5)
			.lean(),
	]);

	return { totalAssigned, seenToday, recentPatients };
}

export async function getDoctorPrescriptions({
	tenantId,
	doctorId,
}: {
	tenantId: string;
	doctorId: string;
}) {
	const { today, tomorrow } = getTodayRange();

	const [issuedToday, pendingDispensing] = await Promise.all([
		Prescription.countDocuments({
			tenantId,
			doctorId,
			createdAt: { $gte: today, $lt: tomorrow },
		}),
		Prescription.countDocuments({
			tenantId,
			doctorId,
			status: PrescriptionStatus.PENDING,
		}),
	]);

	return { issuedToday, pendingDispensing };
}

export async function getDoctorQueue({
	tenantId,
	doctorId,
}: {
	tenantId: string;
	doctorId: string;
}) {
	const { today, tomorrow } = getTodayRange();

	const queue = await Appointment.find({
		tenantId,
		doctorId,
		date: { $gte: today, $lt: tomorrow },
		status: {
			$in: [AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS],
		},
	})
		.sort({ queueNumber: 1 })
		.lean();

	const waiting = queue.filter(
		(a) => a.status === AppointmentStatus.CHECKED_IN,
	).length;

	// Calculate average wait time based on queue size
	const averageWait =
		waiting > 0 ? waiting * ESTIMATED_WAIT_TIMES.PER_PATIENT : 0;

	return { current: queue, waiting, averageWait };
}

// ==================== Nurse Queries ====================

export async function getNurseWardStats({
	tenantId,
	departmentId,
}: {
	tenantId: string;
	departmentId?: string;
}) {
	const activeAdmissions = await Admission.countDocuments({
		tenantId,
		...(departmentId && { departmentId }),
		status: {
			$in: [AdmissionStatus.ADMITTED, AdmissionStatus.UNDER_TREATMENT],
		},
	});

	// TODO: totalBeds should come from hospital/department configuration
	const totalBeds = DEFAULT_BED_CAPACITY;

	return {
		name: departmentId || "General Ward",
		totalBeds,
		occupiedBeds: activeAdmissions,
		availableBeds: totalBeds - activeAdmissions,
	};
}

export async function getNursePatientStats({
	tenantId,
	departmentId,
}: {
	tenantId: string;
	departmentId?: string;
}) {
	const [assigned, critical] = await Promise.all([
		Admission.countDocuments({
			tenantId,
			...(departmentId && { departmentId }),
			status: {
				$in: [AdmissionStatus.ADMITTED, AdmissionStatus.UNDER_TREATMENT],
			},
		}),
		Vitals.countDocuments({
			tenantId,
			"alerts.severity": "CRITICAL",
			recordedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
		}),
	]);

	return { assigned, critical, needsAttention: [] };
}

export async function getNurseVitalsStats({
	tenantId,
	nurseId,
}: {
	tenantId: string;
	nurseId: string;
}) {
	const { today } = getTodayRange();

	const [recordedToday, abnormalVitals] = await Promise.all([
		Vitals.countDocuments({
			tenantId,
			recordedBy: nurseId,
			recordedAt: { $gte: today },
		}),
		Vitals.find({
			tenantId,
			recordedAt: { $gte: today },
			"alerts.severity": { $in: ["HIGH", "CRITICAL"] },
		})
			.limit(10)
			.lean(),
	]);

	// Transform abnormal vitals
	const abnormal = abnormalVitals.map((v) => {
		const firstAlert = v.alerts?.[0] as
			| { parameter?: string; value?: number; severity?: string }
			| undefined;
		return {
			patientId: v.patientId,
			patientName: "",
			parameter: firstAlert?.parameter || "Unknown",
			value: firstAlert?.value || 0,
			severity: firstAlert?.severity || "HIGH",
		};
	});

	return { pendingRecording: 0, recordedToday, abnormal };
}

// ==================== Pharmacist Queries ====================

export async function getPharmacistQueueStats({
	tenantId,
}: {
	tenantId: string;
}) {
	const [pending, urgent, inProgress, nextPrescription] = await Promise.all([
		Dispensing.countDocuments({ tenantId, status: DispensingStatus.PENDING }),
		Prescription.countDocuments({
			tenantId,
			status: PrescriptionStatus.PENDING,
		}),
		Dispensing.countDocuments({
			tenantId,
			status: DispensingStatus.DISPENSING,
		}),
		Prescription.findOne({
			tenantId,
			status: PrescriptionStatus.PENDING,
		})
			.sort({ createdAt: 1 })
			.lean(),
	]);

	return {
		pending,
		urgent,
		inProgress,
		averageWait: pending * ESTIMATED_WAIT_TIMES.PER_PRESCRIPTION,
		nextPrescription,
	};
}

export async function getPharmacistDispensingStats({
	tenantId,
}: {
	tenantId: string;
}) {
	const { today, tomorrow } = getTodayRange();

	const [completedToday, totalToday] = await Promise.all([
		Dispensing.countDocuments({
			tenantId,
			status: DispensingStatus.DISPENSED,
			completedAt: { $gte: today, $lt: tomorrow },
		}),
		Dispensing.countDocuments({
			tenantId,
			createdAt: { $gte: today, $lt: tomorrow },
		}),
	]);

	// Get hourly breakdown
	const byHour = await Dispensing.aggregate([
		{
			$match: {
				tenantId,
				completedAt: { $gte: today, $lt: tomorrow },
				status: DispensingStatus.DISPENSED,
			},
		},
		{
			$group: {
				_id: { $hour: "$completedAt" },
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
		{ $project: { hour: "$_id", count: 1, _id: 0 } },
	]);

	return { completedToday, totalToday, byHour };
}

// ==================== Receptionist Queries ====================

export async function getRegistrationStats({ tenantId }: { tenantId: string }) {
	const { today } = getTodayRange();

	const [registeredToday, recentRegistrations] = await Promise.all([
		Patient.countDocuments({
			tenantId,
			createdAt: { $gte: today },
		}),
		Patient.find({ tenantId }).sort({ createdAt: -1 }).limit(5).lean(),
	]);

	return {
		today: registeredToday,
		pending: 0,
		recentRegistrations: recentRegistrations.map((p) => ({
			id: String(p._id),
			name: `${p.firstName} ${p.lastName}`,
			registeredAt: p.createdAt.toISOString(),
		})),
	};
}

export async function getReceptionistAppointmentStats({
	tenantId,
}: {
	tenantId: string;
}) {
	const { today, tomorrow } = getTodayRange();

	const [todayTotal, scheduled, checkedIn, completed, cancelled, upcoming] =
		await Promise.all([
			Appointment.countDocuments({
				tenantId,
				date: { $gte: today, $lt: tomorrow },
			}),
			Appointment.countDocuments({
				tenantId,
				date: { $gte: today, $lt: tomorrow },
				status: AppointmentStatus.SCHEDULED,
			}),
			Appointment.countDocuments({
				tenantId,
				date: { $gte: today, $lt: tomorrow },
				status: AppointmentStatus.CHECKED_IN,
			}),
			Appointment.countDocuments({
				tenantId,
				date: { $gte: today, $lt: tomorrow },
				status: AppointmentStatus.COMPLETED,
			}),
			Appointment.countDocuments({
				tenantId,
				date: { $gte: today, $lt: tomorrow },
				status: AppointmentStatus.CANCELLED,
			}),
			Appointment.find({
				tenantId,
				date: { $gte: today },
				status: {
					$in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
				},
			})
				.sort({ date: 1, "timeSlot.start": 1 })
				.limit(10)
				.lean(),
		]);

	return {
		todayTotal,
		scheduled,
		checkedIn,
		completed,
		cancelled,
		upcoming: upcoming.map((a) => ({
			id: String(a._id),
			patientId: a.patientId,
			doctorId: a.doctorId,
			time: a.timeSlot.start,
		})),
	};
}

export async function getReceptionistQueueStats({
	tenantId,
}: {
	tenantId: string;
}) {
	const { today, tomorrow } = getTodayRange();

	const byDoctor = await Appointment.aggregate([
		{
			$match: {
				tenantId,
				date: { $gte: today, $lt: tomorrow },
				status: AppointmentStatus.CHECKED_IN,
			},
		},
		{
			$group: {
				_id: "$doctorId",
				waiting: { $sum: 1 },
			},
		},
		{
			$project: {
				doctorId: "$_id",
				name: "",
				waiting: 1,
				_id: 0,
			},
		},
	]);

	const totalWaiting = byDoctor.reduce((sum, d) => sum + d.waiting, 0);

	return {
		byDoctor,
		totalWaiting,
		averageWait: totalWaiting * ESTIMATED_WAIT_TIMES.PER_PATIENT,
	};
}

export async function getReceptionistCheckInStats({
	tenantId,
}: {
	tenantId: string;
}) {
	const { today, tomorrow } = getTodayRange();

	const [completedToday, pending] = await Promise.all([
		Appointment.countDocuments({
			tenantId,
			date: { $gte: today, $lt: tomorrow },
			checkedInAt: { $exists: true },
		}),
		Appointment.find({
			tenantId,
			date: { $gte: today, $lt: tomorrow },
			status: {
				$in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
			},
		})
			.sort({ "timeSlot.start": 1 })
			.limit(10)
			.lean(),
	]);

	return {
		completedToday,
		pending: pending.map((a) => ({
			id: String(a._id),
			patientId: a.patientId,
			scheduledTime: a.timeSlot.start,
		})),
	};
}

// ==================== Helper Aggregations ====================

async function getPatientsByType({ tenantId }: { tenantId: string }) {
	const results = await Patient.aggregate([
		{ $match: { tenantId } },
		{ $group: { _id: "$patientType", count: { $sum: 1 } } },
	]);

	return {
		opd: results.find((r) => r._id === PatientType.OPD)?.count || 0,
		ipd: results.find((r) => r._id === PatientType.IPD)?.count || 0,
	};
}

async function getPatientsByDepartment({ tenantId }: { tenantId: string }) {
	return Patient.aggregate([
		{ $match: { tenantId, departmentId: { $exists: true, $ne: null } } },
		{ $group: { _id: "$departmentId", count: { $sum: 1 } } },
		{
			$lookup: {
				from: "department",
				localField: "_id",
				foreignField: "_id",
				as: "dept",
			},
		},
		{
			$project: {
				departmentId: "$_id",
				name: { $ifNull: [{ $arrayElemAt: ["$dept.name", 0] }, "Unknown"] },
				count: 1,
				_id: 0,
			},
		},
	]);
}

async function getDailyPatientTrend({
	tenantId,
	days,
}: {
	tenantId: string;
	days: number;
}) {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);
	startDate.setHours(0, 0, 0, 0);

	return Patient.aggregate([
		{ $match: { tenantId, createdAt: { $gte: startDate } } },
		{
			$group: {
				_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
		{ $project: { date: "$_id", count: 1, _id: 0 } },
	]);
}

async function getAppointmentsByDepartment({ tenantId }: { tenantId: string }) {
	const { today, tomorrow } = getTodayRange();

	return Appointment.aggregate([
		{ $match: { tenantId, date: { $gte: today, $lt: tomorrow } } },
		{ $group: { _id: "$departmentId", count: { $sum: 1 } } },
		{
			$lookup: {
				from: "department",
				localField: "_id",
				foreignField: "_id",
				as: "dept",
			},
		},
		{
			$project: {
				departmentId: "$_id",
				name: { $ifNull: [{ $arrayElemAt: ["$dept.name", 0] }, "Unknown"] },
				count: 1,
				_id: 0,
			},
		},
	]);
}

async function getDailyAppointmentTrend({
	tenantId,
	days,
}: {
	tenantId: string;
	days: number;
}) {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);
	startDate.setHours(0, 0, 0, 0);

	return Appointment.aggregate([
		{ $match: { tenantId, date: { $gte: startDate } } },
		{
			$group: {
				_id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
		{ $project: { date: "$_id", count: 1, _id: 0 } },
	]);
}

async function getStaffByRole({ tenantId }: { tenantId: string }) {
	return Staff.aggregate([
		{ $match: { tenantId, status: StaffStatus.ACTIVE } },
		{ $unwind: "$roles" },
		{ $group: { _id: "$roles", count: { $sum: 1 } } },
		{ $project: { role: "$_id", count: 1, _id: 0 } },
	]);
}
