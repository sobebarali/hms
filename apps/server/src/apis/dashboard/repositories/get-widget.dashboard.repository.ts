/**
 * Widget repository
 *
 * Database queries for dashboard widgets
 */

import {
	Admission,
	AdmissionStatus,
	Appointment,
	Patient,
	Staff,
	StaffStatus,
} from "@hms/db";
import { DEFAULT_BED_CAPACITY } from "../dashboard.constants";

export async function getPatientTrend({
	tenantId,
	days = 30,
}: {
	tenantId: string;
	days?: number;
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

export async function getAppointmentTrend({
	tenantId,
	days = 30,
}: {
	tenantId: string;
	days?: number;
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

export async function getDepartmentLoad({ tenantId }: { tenantId: string }) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return Appointment.aggregate([
		{ $match: { tenantId, date: { $gte: today } } },
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
				load: "$count",
				_id: 0,
			},
		},
	]);
}

export async function getBedOccupancy({ tenantId }: { tenantId: string }) {
	const activeAdmissions = await Admission.countDocuments({
		tenantId,
		status: {
			$in: [AdmissionStatus.ADMITTED, AdmissionStatus.UNDER_TREATMENT],
		},
	});

	// TODO: totalBeds should come from hospital configuration
	const totalBeds = DEFAULT_BED_CAPACITY;
	const occupancyRate =
		totalBeds > 0 ? Math.round((activeAdmissions / totalBeds) * 100) : 0;

	return {
		occupied: activeAdmissions,
		total: totalBeds,
		available: totalBeds - activeAdmissions,
		occupancyRate,
	};
}

export async function getStaffAttendance({ tenantId }: { tenantId: string }) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const [total, loggedIn] = await Promise.all([
		Staff.countDocuments({ tenantId, status: StaffStatus.ACTIVE }),
		Staff.countDocuments({
			tenantId,
			status: StaffStatus.ACTIVE,
			lastLogin: { $gte: today },
		}),
	]);

	return {
		total,
		present: loggedIn,
		absent: total - loggedIn,
		attendanceRate: total > 0 ? Math.round((loggedIn / total) * 100) : 0,
	};
}

export async function getRevenueTrend({
	tenantId: _tenantId,
	days = 30,
}: {
	tenantId: string;
	days?: number;
}) {
	// Revenue tracking not implemented yet
	// This would aggregate from billing/invoices
	const _startDate = new Date();
	_startDate.setDate(_startDate.getDate() - days);

	return [];
}
