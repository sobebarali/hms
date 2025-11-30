/**
 * Full menu structure configuration
 *
 * Defines all possible menu items for the application.
 * Items are filtered based on user permissions at runtime.
 */

import type { MenuItem } from "./validations/get.menu.validation";

export const FULL_MENU_STRUCTURE: MenuItem[] = [
	// Dashboard - available to all authenticated users
	{
		id: "dashboard",
		label: "Dashboard",
		icon: "dashboard",
		path: "/dashboard",
		permission: "DASHBOARD:VIEW",
		order: 1,
		visible: true,
	},

	// Users - Hospital Admin and above
	{
		id: "users",
		label: "Users",
		icon: "people",
		permission: "USER:READ",
		order: 2,
		visible: true,
		children: [
			{
				id: "users-list",
				label: "All Users",
				path: "/users",
				permission: "USER:READ",
				order: 1,
			},
			{
				id: "users-add",
				label: "Add User",
				path: "/users/add",
				permission: "USER:CREATE",
				order: 2,
			},
		],
	},

	// Patients
	{
		id: "patients",
		label: "Patients",
		icon: "people",
		permission: "PATIENT:READ",
		order: 3,
		visible: true,
		children: [
			{
				id: "patients-list",
				label: "All Patients",
				path: "/patients",
				permission: "PATIENT:READ",
				order: 1,
			},
			{
				id: "patients-register",
				label: "Register",
				path: "/patients/register",
				permission: "PATIENT:CREATE",
				order: 2,
			},
		],
	},

	// Doctors - visible to Hospital Admin
	{
		id: "doctors",
		label: "Doctors",
		icon: "medical_services",
		path: "/doctors",
		permission: "DOCTOR:READ",
		order: 4,
		visible: true,
	},

	// Prescriptions
	{
		id: "prescriptions",
		label: "Prescriptions",
		icon: "medication",
		permission: "PRESCRIPTION:READ",
		order: 5,
		visible: true,
		children: [
			{
				id: "prescriptions-create",
				label: "Create",
				path: "/prescriptions/create",
				permission: "PRESCRIPTION:CREATE",
				order: 1,
			},
			{
				id: "prescriptions-history",
				label: "History",
				path: "/prescriptions",
				permission: "PRESCRIPTION:READ",
				order: 2,
			},
		],
	},

	// Appointments
	{
		id: "appointments",
		label: "Appointments",
		icon: "schedule",
		permission: "APPOINTMENT:READ",
		order: 6,
		visible: true,
		children: [
			{
				id: "appointments-schedule",
				label: "Schedule",
				path: "/appointments/schedule",
				permission: "APPOINTMENT:CREATE",
				order: 1,
			},
			{
				id: "appointments-calendar",
				label: "Calendar",
				path: "/appointments",
				permission: "APPOINTMENT:READ",
				order: 2,
			},
		],
	},

	// Vitals - Nurses
	{
		id: "vitals",
		label: "Vitals",
		icon: "vital_signs",
		permission: "VITALS:READ",
		order: 7,
		visible: true,
		children: [
			{
				id: "vitals-record",
				label: "Record Vitals",
				path: "/vitals/record",
				permission: "VITALS:CREATE",
				order: 1,
			},
			{
				id: "vitals-history",
				label: "History",
				path: "/vitals",
				permission: "VITALS:READ",
				order: 2,
			},
		],
	},

	// Dispensing - Pharmacists
	{
		id: "dispensing",
		label: "Dispensing",
		icon: "local_pharmacy",
		permission: "DISPENSING:READ",
		order: 8,
		visible: true,
		children: [
			{
				id: "dispensing-pending",
				label: "Pending",
				path: "/dispensing/pending",
				permission: "DISPENSING:READ",
				order: 1,
			},
			{
				id: "dispensing-process",
				label: "Process",
				path: "/dispensing/process",
				permission: "DISPENSING:CREATE",
				order: 2,
			},
			{
				id: "dispensing-history",
				label: "Dispensed",
				path: "/dispensing",
				permission: "DISPENSING:READ",
				order: 3,
			},
		],
	},

	// Inventory - Pharmacists
	{
		id: "inventory",
		label: "Inventory",
		icon: "inventory",
		path: "/inventory",
		permission: "INVENTORY:READ",
		order: 9,
		visible: true,
	},

	// Queue - Receptionists
	{
		id: "queue",
		label: "Queue",
		icon: "queue",
		path: "/queue",
		permission: "QUEUE:MANAGE",
		order: 10,
		visible: true,
	},

	// Departments - Hospital Admin
	{
		id: "departments",
		label: "Departments",
		icon: "business",
		path: "/departments",
		permission: "DEPARTMENT:MANAGE",
		order: 11,
		visible: true,
	},

	// Reports - Hospital Admin
	{
		id: "reports",
		label: "Reports",
		icon: "assignment",
		path: "/reports",
		permission: "REPORT:READ",
		order: 12,
		visible: true,
	},

	// Settings - Hospital Admin
	{
		id: "settings",
		label: "Settings",
		icon: "settings",
		path: "/settings",
		permission: "SETTINGS:MANAGE",
		order: 13,
		visible: true,
	},
];
