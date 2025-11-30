/**
 * Dashboard service
 *
 * Role-based business logic for dashboard data
 */

import { RoleNames } from "../../../constants/rbac.constants";
import { BadRequestError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { DASHBOARD_DEFAULTS } from "../dashboard.constants";
import * as repo from "../repositories/get.dashboard.repository";
import {
	findPatientsByIds,
	findStaffByIds,
} from "../repositories/shared.dashboard.repository";
import type {
	DoctorDashboardOutput,
	GetDashboardOutput,
	HospitalAdminDashboardOutput,
	NurseDashboardOutput,
	PharmacistDashboardOutput,
	ReceptionistDashboardOutput,
} from "../validations/get.dashboard.validation";

const logger = createServiceLogger("dashboard");

/**
 * Get role-specific dashboard data
 */
export async function getDashboardService({
	tenantId,
	staffId,
	roles,
	attributes,
}: {
	tenantId: string;
	staffId?: string;
	roles: string[];
	attributes?: { department?: string };
}): Promise<GetDashboardOutput> {
	const primaryRole = getPrimaryRole(roles);

	logger.debug({ primaryRole, tenantId }, "Fetching dashboard for role");

	switch (primaryRole) {
		case RoleNames.HOSPITAL_ADMIN:
		case RoleNames.SUPER_ADMIN:
			return getHospitalAdminDashboard({ tenantId });

		case RoleNames.DOCTOR:
			if (!staffId) {
				throw new BadRequestError(
					"MISSING_STAFF_ID",
					"Doctor dashboard requires staffId to be set on user profile",
				);
			}
			return getDoctorDashboard({ tenantId, doctorId: staffId });

		case RoleNames.NURSE:
			return getNurseDashboard({
				tenantId,
				nurseId: staffId,
				departmentId: attributes?.department,
			});

		case RoleNames.PHARMACIST:
			return getPharmacistDashboard({ tenantId });

		case RoleNames.RECEPTIONIST:
			return getReceptionistDashboard({ tenantId });

		default:
			logger.debug({ primaryRole }, "Unknown role, returning admin dashboard");
			return getHospitalAdminDashboard({ tenantId });
	}
}

/**
 * Get Hospital Admin dashboard
 */
async function getHospitalAdminDashboard({
	tenantId,
}: {
	tenantId: string;
}): Promise<HospitalAdminDashboardOutput> {
	const [overview, patients, appointments, staff] = await Promise.all([
		repo.getOverviewStats({ tenantId }),
		repo.getPatientStats({ tenantId }),
		repo.getAppointmentStatsForAdmin({ tenantId }),
		repo.getStaffStats({ tenantId }),
	]);

	return {
		overview,
		patients,
		appointments,
		staff,
		alerts: [], // Alerts system not implemented yet
	};
}

/**
 * Get Doctor dashboard
 */
async function getDoctorDashboard({
	tenantId,
	doctorId,
}: {
	tenantId: string;
	doctorId: string;
}): Promise<DoctorDashboardOutput> {
	const [todayStats, appointmentsData, patientsData, prescriptions, queueData] =
		await Promise.all([
			repo.getDoctorTodayStats({ tenantId, doctorId }),
			repo.getDoctorAppointments({ tenantId, doctorId }),
			repo.getDoctorPatients({ tenantId, doctorId }),
			repo.getDoctorPrescriptions({ tenantId, doctorId }),
			repo.getDoctorQueue({ tenantId, doctorId }),
		]);

	// Get patient details for enrichment
	const patientIds = [
		...(todayStats.currentPatient ? [todayStats.currentPatient.patientId] : []),
		...(todayStats.nextPatient ? [todayStats.nextPatient.patientId] : []),
		...appointmentsData.upcoming.map((a) => a.patientId),
		...appointmentsData.todaySchedule.map((a) => a.patientId),
		...patientsData.recentPatients.map((p) => String(p._id)),
	];

	const uniquePatientIds = [...new Set(patientIds.filter(Boolean))];
	const patients =
		uniquePatientIds.length > 0
			? await findPatientsByIds({ tenantId, patientIds: uniquePatientIds })
			: [];
	const patientMap = new Map<string, { firstName: string; lastName: string }>(
		patients.map((p) => [String(p._id), p]),
	);

	// Transform current patient
	const currentPatient = todayStats.currentPatient
		? {
				id: String(todayStats.currentPatient._id),
				name: getPatientName(
					patientMap.get(todayStats.currentPatient.patientId),
				),
				patientId: todayStats.currentPatient.patientId,
			}
		: null;

	// Transform next patient
	const nextPatient = todayStats.nextPatient
		? {
				id: String(todayStats.nextPatient._id),
				name: getPatientName(patientMap.get(todayStats.nextPatient.patientId)),
				patientId: todayStats.nextPatient.patientId,
			}
		: null;

	// Transform appointments
	const upcoming = appointmentsData.upcoming.map((a) => ({
		id: String(a._id),
		patientName: getPatientName(patientMap.get(a.patientId)),
		time: a.timeSlot.start,
		type: a.type,
	}));

	const todaySchedule = appointmentsData.todaySchedule.map((a) => ({
		id: String(a._id),
		patientName: getPatientName(patientMap.get(a.patientId)),
		time: a.timeSlot.start,
		status: a.status,
	}));

	// Transform recent patients
	const recentPatients = patientsData.recentPatients.map((p) => ({
		id: String(p._id),
		name: `${p.firstName} ${p.lastName}`,
		lastVisit: p.updatedAt.toISOString(),
	}));

	// Transform queue
	const current = queueData.current.map((a) => ({
		queueNumber: a.queueNumber || 0,
		patientName: getPatientName(patientMap.get(a.patientId)),
		status: a.status,
	}));

	return {
		today: {
			totalAppointments: todayStats.totalAppointments,
			completed: todayStats.completed,
			remaining: todayStats.remaining,
			currentPatient,
			nextPatient,
		},
		appointments: {
			upcoming,
			todaySchedule,
			pendingFollowUps: appointmentsData.pendingFollowUps,
		},
		patients: {
			totalAssigned: patientsData.totalAssigned,
			seenToday: patientsData.seenToday,
			recentPatients,
		},
		prescriptions,
		queue: {
			current,
			waiting: queueData.waiting,
			averageWait: queueData.averageWait,
		},
	};
}

/**
 * Get Nurse dashboard
 */
async function getNurseDashboard({
	tenantId,
	nurseId,
	departmentId,
}: {
	tenantId: string;
	nurseId?: string;
	departmentId?: string;
}): Promise<NurseDashboardOutput> {
	const [ward, patients, vitals] = await Promise.all([
		repo.getNurseWardStats({ tenantId, departmentId }),
		repo.getNursePatientStats({ tenantId, departmentId }),
		nurseId
			? repo.getNurseVitalsStats({ tenantId, nurseId })
			: { pendingRecording: 0, recordedToday: 0, abnormal: [] },
	]);

	return {
		ward,
		patients,
		vitals,
		tasks: {
			medicationDue: [],
			vitalsDue: [],
			pending: 0,
		},
		alerts: [],
	};
}

/**
 * Get Pharmacist dashboard
 */
async function getPharmacistDashboard({
	tenantId,
}: {
	tenantId: string;
}): Promise<PharmacistDashboardOutput> {
	const [queueStats, dispensingStats] = await Promise.all([
		repo.getPharmacistQueueStats({ tenantId }),
		repo.getPharmacistDispensingStats({ tenantId }),
	]);

	// Look up patient name for next prescription
	let nextPrescription: {
		id: string;
		patientName: string;
		priority: string;
	} | null = null;

	if (queueStats.nextPrescription) {
		const patients = await findPatientsByIds({
			tenantId,
			patientIds: [queueStats.nextPrescription.patientId],
		});
		const patient = patients[0];

		nextPrescription = {
			id: String(queueStats.nextPrescription._id),
			patientName: patient
				? `${patient.firstName} ${patient.lastName}`
				: "Unknown Patient",
			priority: "NORMAL",
		};
	}

	return {
		queue: {
			pending: queueStats.pending,
			urgent: queueStats.urgent,
			inProgress: queueStats.inProgress,
			averageWait: queueStats.averageWait,
			nextPrescription,
		},
		dispensing: dispensingStats,
		inventory: {
			lowStock: [],
			expiringSoon: [],
			outOfStock: 0,
		},
		statistics: {
			averageProcessingTime: DASHBOARD_DEFAULTS.PRESCRIPTION_PROCESSING_TIME,
			prescriptionsHandled: dispensingStats.completedToday,
		},
	};
}

/**
 * Get Receptionist dashboard
 */
async function getReceptionistDashboard({
	tenantId,
}: {
	tenantId: string;
}): Promise<ReceptionistDashboardOutput> {
	const [registrations, appointments, queue, checkIns] = await Promise.all([
		repo.getRegistrationStats({ tenantId }),
		repo.getReceptionistAppointmentStats({ tenantId }),
		repo.getReceptionistQueueStats({ tenantId }),
		repo.getReceptionistCheckInStats({ tenantId }),
	]);

	// Collect all patient and doctor IDs for enrichment
	const patientIds = [
		...appointments.upcoming.map((a) => a.patientId),
		...checkIns.pending.map((a) => a.patientId),
	];
	const doctorIds = [
		...appointments.upcoming.map((a) => a.doctorId),
		...queue.byDoctor.map((d) => d.doctorId),
	];

	const uniquePatientIds = [...new Set(patientIds.filter(Boolean))];
	const uniqueDoctorIds = [...new Set(doctorIds.filter(Boolean))];

	// Fetch patient and staff details in parallel
	const [patients, staff] = await Promise.all([
		uniquePatientIds.length > 0
			? findPatientsByIds({ tenantId, patientIds: uniquePatientIds })
			: [],
		uniqueDoctorIds.length > 0
			? findStaffByIds({ tenantId, staffIds: uniqueDoctorIds })
			: [],
	]);

	const patientMap = new Map<string, { firstName: string; lastName: string }>(
		patients.map((p) => [String(p._id), p]),
	);
	const staffMap = new Map<string, { firstName: string; lastName: string }>(
		staff.map((s) => [String(s._id), s]),
	);

	// Enrich appointments.upcoming with names
	const enrichedUpcoming = appointments.upcoming.map((a) => ({
		id: a.id,
		patientName: getPatientName(patientMap.get(a.patientId)),
		doctorName: getStaffName(staffMap.get(a.doctorId)),
		time: a.time,
	}));

	// Enrich checkIns.pending with names
	const enrichedPending = checkIns.pending.map((a) => ({
		id: a.id,
		patientName: getPatientName(patientMap.get(a.patientId)),
		scheduledTime: a.scheduledTime,
	}));

	// Enrich queue.byDoctor with names
	const enrichedByDoctor = queue.byDoctor.map((d) => ({
		doctorId: d.doctorId,
		name: getStaffName(staffMap.get(d.doctorId)),
		waiting: d.waiting,
	}));

	return {
		registrations,
		appointments: {
			...appointments,
			upcoming: enrichedUpcoming,
		},
		queue: {
			...queue,
			byDoctor: enrichedByDoctor,
		},
		checkIns: {
			completedToday: checkIns.completedToday,
			pending: enrichedPending,
		},
	};
}

/**
 * Get primary role from user roles (highest in hierarchy)
 */
function getPrimaryRole(roles: string[]): string {
	const hierarchy = [
		RoleNames.SUPER_ADMIN,
		RoleNames.HOSPITAL_ADMIN,
		RoleNames.DOCTOR,
		RoleNames.NURSE,
		RoleNames.PHARMACIST,
		RoleNames.RECEPTIONIST,
	];

	for (const role of hierarchy) {
		if (roles.includes(role)) {
			return role;
		}
	}

	return roles[0] || RoleNames.RECEPTIONIST;
}

/**
 * Helper to get patient name from patient object
 */
function getPatientName(
	patient: { firstName: string; lastName: string } | undefined,
): string {
	if (!patient) return "Unknown Patient";
	return `${patient.firstName} ${patient.lastName}`;
}

/**
 * Helper to get staff name from staff object
 */
function getStaffName(
	staff: { firstName: string; lastName: string } | undefined,
): string {
	if (!staff) return "Unknown Staff";
	return `${staff.firstName} ${staff.lastName}`;
}
