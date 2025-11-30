import { BadRequestError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { searchPatients } from "../repositories/search.patients.repository";
import type { SearchPatientsInput } from "../validations/search.patients.validation";

const logger = createServiceLogger("searchPatients");

/**
 * Search patients within the hospital tenant
 * Applies ABAC filtering based on user role and department
 */
export async function searchPatientsService({
	tenantId,
	userRoles,
	userDepartment,
	userId,
	q,
	type,
	limit: limitParam,
}: {
	tenantId: string;
	userRoles: string[];
	userDepartment?: string;
	userId: string;
} & SearchPatientsInput) {
	logger.info({ tenantId, q, type }, "Searching patients");

	// Validate query length
	if (q.length < 2) {
		throw new BadRequestError(
			"Search query must be at least 2 characters",
			"INVALID_QUERY",
		);
	}

	const limit = Number(limitParam) || 10;

	// ABAC: Determine effective filters based on user role
	const isAdmin =
		userRoles.includes("SUPER_ADMIN") || userRoles.includes("HOSPITAL_ADMIN");
	const isDoctor = userRoles.includes("DOCTOR");

	let departmentFilter: string | undefined;
	let assignedDoctorFilter: string | undefined;

	// Doctors can only search patients in their department or assigned to them
	if (isDoctor && !isAdmin) {
		if (!userDepartment) {
			// Doctor without department - can only search assigned patients
			assignedDoctorFilter = userId;
			logger.info(
				{ userId },
				"ABAC: Doctor without department, restricting search to assigned patients",
			);
		} else {
			// Doctor with department - restrict to their department
			departmentFilter = userDepartment;
			logger.info(
				{ userId, userDepartment },
				"ABAC: Restricting patient search to doctor's department",
			);
		}
	}

	const result = await searchPatients({
		tenantId,
		q,
		type,
		limit,
		departmentFilter,
		assignedDoctorFilter,
	});

	logger.info(
		{
			tenantId,
			q,
			count: result.count,
		},
		"Patients search completed",
	);

	return result;
}
