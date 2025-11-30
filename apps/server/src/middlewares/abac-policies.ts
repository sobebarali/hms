import { Patient, Prescription, Vitals } from "@hms/db";
import type { Request } from "express";
import { abacPolicy } from "./authorize";

/**
 * ABAC Policy: Patient Ownership
 *
 * Restricts patient access to assigned doctors only.
 * Doctors can only access patients explicitly assigned to them.
 *
 * Bypassed for:
 * - SUPER_ADMIN and HOSPITAL_ADMIN (full access)
 * - Non-doctor roles with appropriate permissions
 *
 * Applied to:
 * - GET /api/patients/:id
 * - PATCH /api/patients/:id
 * - Patient-related endpoints
 */
export const patientOwnershipPolicy = abacPolicy(async (req: Request) => {
	const patientId = req.params.id;
	const userId = req.user?.id;
	const roles = req.user?.roles || [];
	const tenantId = req.user?.tenantId;

	if (!userId || !tenantId) {
		return false;
	}

	// Admins bypass ownership checks
	if (roles.includes("SUPER_ADMIN") || roles.includes("HOSPITAL_ADMIN")) {
		return true;
	}

	// For doctors, check if patient is assigned to them
	if (roles.includes("DOCTOR")) {
		const patient = await Patient.findOne({
			_id: patientId,
			tenantId,
			assignedDoctorId: userId,
		}).lean();

		return !!patient;
	}

	// For other roles (nurses, pharmacists, receptionists), allow if they have the permission
	// Permission check already happened in authorize() middleware
	return true;
});

/**
 * ABAC Policy: Department-Scoped Access
 *
 * Restricts resource access to users within the same department.
 * Staff can only access resources (patients, appointments, etc.) in their assigned department.
 *
 * Bypassed for:
 * - SUPER_ADMIN and HOSPITAL_ADMIN (cross-department access)
 *
 * Applied to:
 * - Department-specific resource endpoints
 * - Cross-department operations
 */
export const departmentPolicy = abacPolicy(async (req: Request) => {
	const userDepartment = req.user?.attributes?.department;
	const roles = req.user?.roles || [];

	// Admins bypass department restrictions
	if (roles.includes("SUPER_ADMIN") || roles.includes("HOSPITAL_ADMIN")) {
		return true;
	}

	// If user doesn't have a department assignment, deny access
	if (!userDepartment) {
		return false;
	}

	// Extract resource department from request body or params
	const resourceDepartment =
		req.body?.departmentId ||
		req.params?.departmentId ||
		req.query?.departmentId;

	// If resource has no department, allow access (not department-scoped)
	if (!resourceDepartment) {
		return true;
	}

	// Check if user's department matches resource department
	return userDepartment === resourceDepartment;
});

/**
 * ABAC Policy: Prescription Ownership
 *
 * Restricts prescription access based on role:
 * - Doctors: Can only access prescriptions they created
 * - Pharmacists: Can access prescriptions for dispensing
 * - Nurses: Can view prescriptions for patient care
 *
 * Bypassed for:
 * - SUPER_ADMIN and HOSPITAL_ADMIN
 */
export const prescriptionOwnershipPolicy = abacPolicy(async (req: Request) => {
	const prescriptionId = req.params.id;
	const userId = req.user?.id;
	const roles = req.user?.roles || [];
	const tenantId = req.user?.tenantId;

	if (!userId || !tenantId) {
		return false;
	}

	// Admins bypass ownership checks
	if (roles.includes("SUPER_ADMIN") || roles.includes("HOSPITAL_ADMIN")) {
		return true;
	}

	const prescription = await Prescription.findOne({
		_id: prescriptionId,
		tenantId,
	}).lean();

	if (!prescription) {
		return false;
	}

	// Doctors can only access their own prescriptions
	if (roles.includes("DOCTOR")) {
		return String(prescription.doctorId) === userId;
	}

	// Pharmacists and nurses can access prescriptions (permission check in authorize())
	if (roles.includes("PHARMACIST") || roles.includes("NURSE")) {
		return true;
	}

	return false;
});

/**
 * ABAC Policy: Vitals Ownership
 *
 * Restricts vitals access based on patient assignment:
 * - Doctors: Can only access vitals for their assigned patients
 * - Nurses: Can access vitals for patients they recorded (or all with permission)
 *
 * Bypassed for:
 * - SUPER_ADMIN and HOSPITAL_ADMIN
 */
export const vitalsOwnershipPolicy = abacPolicy(async (req: Request) => {
	const vitalsId = req.params.id;
	const userId = req.user?.id;
	const roles = req.user?.roles || [];
	const tenantId = req.user?.tenantId;

	if (!userId || !tenantId) {
		return false;
	}

	// Admins bypass ownership checks
	if (roles.includes("SUPER_ADMIN") || roles.includes("HOSPITAL_ADMIN")) {
		return true;
	}

	const vitals = await Vitals.findOne({
		_id: vitalsId,
		tenantId,
	}).lean();

	if (!vitals) {
		return false;
	}

	// For doctors, check if the vitals belong to their assigned patient
	if (roles.includes("DOCTOR")) {
		const patient = await Patient.findOne({
			_id: vitals.patientId,
			tenantId,
			assignedDoctorId: userId,
		}).lean();

		return !!patient;
	}

	// Nurses can access vitals (permission check in authorize())
	if (roles.includes("NURSE")) {
		return true;
	}

	return false;
});

/**
 * ABAC Policy: Self-Profile Access Only
 *
 * Restricts user profile access to the authenticated user's own profile.
 * Users can only view/edit their own profile unless they're admins.
 *
 * Bypassed for:
 * - SUPER_ADMIN and HOSPITAL_ADMIN (can access any profile)
 * - Users with USER:READ or USER:UPDATE permissions
 */
export const selfProfilePolicy = abacPolicy((req: Request) => {
	const targetUserId = req.params.id;
	const userId = req.user?.id;
	const roles = req.user?.roles || [];
	const permissions = req.user?.permissions || [];

	// Admins bypass restrictions
	if (roles.includes("SUPER_ADMIN") || roles.includes("HOSPITAL_ADMIN")) {
		return true;
	}

	// Users with USER:READ or USER:UPDATE can access any profile
	if (
		permissions.includes("USER:READ") ||
		permissions.includes("USER:UPDATE") ||
		permissions.includes("USER:MANAGE")
	) {
		return true;
	}

	// Otherwise, can only access own profile
	return targetUserId === userId;
});

/**
 * ABAC Policy: Shift-Based Access
 *
 * Restricts access based on user's shift schedule.
 * Optional policy for time-based access control.
 *
 * Bypassed for:
 * - SUPER_ADMIN and HOSPITAL_ADMIN
 * - Users without shift assignments (24/7 access)
 */
export const shiftBasedPolicy = abacPolicy((req: Request) => {
	const roles = req.user?.roles || [];
	const shift = req.user?.attributes?.shift;

	// Admins and users without shifts bypass
	if (
		roles.includes("SUPER_ADMIN") ||
		roles.includes("HOSPITAL_ADMIN") ||
		!shift
	) {
		return true;
	}

	// Get current hour (0-23)
	const currentHour = new Date().getHours();

	// Define shift hours
	const shifts = {
		MORNING: { start: 6, end: 14 }, // 6 AM - 2 PM
		EVENING: { start: 14, end: 22 }, // 2 PM - 10 PM
		NIGHT: { start: 22, end: 6 }, // 10 PM - 6 AM (wraps around)
	};

	const userShift = shifts[shift as keyof typeof shifts];
	if (!userShift) {
		return true; // Unknown shift, allow access
	}

	// Handle night shift wrap-around
	if (userShift.start > userShift.end) {
		return currentHour >= userShift.start || currentHour < userShift.end;
	}

	return currentHour >= userShift.start && currentHour < userShift.end;
});
