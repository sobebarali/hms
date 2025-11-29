import { findHospitalById as findHospitalByIdShared } from "./shared.hospital.repository";

/**
 * Find hospital by ID (wrapper for backward compatibility with different param name)
 */
export async function findHospitalById({ id }: { id: string }) {
	return findHospitalByIdShared({ hospitalId: id });
}
