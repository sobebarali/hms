import { BadRequestError, ForbiddenError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { listPatients } from "../repositories/list.patients.repository";
import { findDepartmentsByIds } from "../repositories/shared.patients.repository";
import type {
	ListPatientsInput,
	ListPatientsOutput,
} from "../validations/list.patients.validation";

const logger = createServiceLogger("listPatients");

/**
 * List patients within the hospital tenant
 * Applies ABAC filtering based on user role and department
 */
export async function listPatientsService({
	tenantId,
	userRoles,
	userDepartment,
	userId,
	page: pageParam,
	limit: limitParam,
	patientType,
	department,
	assignedDoctor,
	status,
	startDate,
	endDate,
	search,
	sortBy: sortByParam,
	sortOrder: sortOrderParam,
}: {
	tenantId: string;
	userRoles: string[];
	userDepartment?: string;
	userId: string;
} & ListPatientsInput): Promise<{
	data: ListPatientsOutput[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}> {
	logger.info(
		{ tenantId, page: pageParam, limit: limitParam },
		"Listing patients",
	);

	const page = Number(pageParam) || 1;
	const limit = Number(limitParam) || 20;
	const sortBy = sortByParam || "createdAt";
	const sortOrder = sortOrderParam || "desc";

	// ABAC: Determine effective filters based on user role
	let effectiveDepartment = department;
	let effectiveAssignedDoctor = assignedDoctor;

	const isAdmin =
		userRoles.includes("SUPER_ADMIN") || userRoles.includes("HOSPITAL_ADMIN");
	const isDoctor = userRoles.includes("DOCTOR");

	// Doctors can only view patients in their department or assigned to them
	if (isDoctor && !isAdmin) {
		if (!userDepartment) {
			// Doctor without department assignment - can only see assigned patients
			effectiveAssignedDoctor = userId;
			logger.info(
				{ userId },
				"ABAC: Doctor without department, restricting to assigned patients",
			);
		} else {
			// Doctor with department - restrict to their department
			// If they requested a different department, deny
			if (department && department !== userDepartment) {
				throw new ForbiddenError(
					"You can only view patients in your department",
					"DEPARTMENT_ACCESS_DENIED",
				);
			}
			effectiveDepartment = userDepartment;
			logger.info(
				{ userId, userDepartment },
				"ABAC: Restricting patient list to doctor's department",
			);
		}
	}

	// Validate date range if provided
	if (startDate && endDate) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		if (start > end) {
			throw new BadRequestError(
				"Start date must be before end date",
				"INVALID_DATE_RANGE",
			);
		}
	}

	const result = await listPatients({
		tenantId,
		page,
		limit,
		patientType,
		department: effectiveDepartment,
		assignedDoctor: effectiveAssignedDoctor,
		status,
		startDate,
		endDate,
		search,
		sortBy,
		sortOrder,
	});

	// Get all unique department IDs for batch lookup
	const departmentIds = [
		...new Set(
			result.patients.map((p) => p.departmentId).filter(Boolean) as string[],
		),
	];

	// Fetch departments in a single batch query
	const departments =
		departmentIds.length > 0
			? await findDepartmentsByIds({ departmentIds })
			: [];
	const departmentMap = new Map(
		departments.map((d) => [String(d._id), d.name]),
	);

	// Map to output DTO (business logic belongs in service layer)
	const data: ListPatientsOutput[] = result.patients.map((patient) => ({
		id: String(patient._id),
		patientId: patient.patientId,
		firstName: patient.firstName,
		lastName: patient.lastName,
		dateOfBirth: patient.dateOfBirth?.toISOString() || "",
		gender: patient.gender,
		phone: patient.phone,
		patientType: patient.patientType,
		department: patient.departmentId
			? departmentMap.get(String(patient.departmentId)) || ""
			: "",
		status: patient.status || "ACTIVE",
		createdAt: patient.createdAt?.toISOString() || new Date().toISOString(),
	}));

	logger.info(
		{
			tenantId,
			page,
			limit,
			total: result.total,
		},
		"Patients listed successfully",
	);

	return {
		data,
		total: result.total,
		page: result.page,
		limit: result.limit,
		totalPages: result.totalPages,
	};
}
