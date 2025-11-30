/**
 * React hooks for vitals client using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type ListVitalsParams,
	type RecordVitalsInput,
	type TrendsParams,
	type UpdateVitalsInput,
	vitalsClient,
} from "../lib/vitals-client";

// Query keys
export const vitalsKeys = {
	all: ["vitals"] as const,
	lists: () => [...vitalsKeys.all, "list"] as const,
	list: (patientId: string, params: ListVitalsParams) =>
		[...vitalsKeys.lists(), patientId, params] as const,
	details: () => [...vitalsKeys.all, "detail"] as const,
	detail: (id: string) => [...vitalsKeys.details(), id] as const,
	latest: () => [...vitalsKeys.all, "latest"] as const,
	latestByPatient: (patientId: string) =>
		[...vitalsKeys.latest(), patientId] as const,
	trends: () => [...vitalsKeys.all, "trends"] as const,
	trend: (patientId: string, params: TrendsParams) =>
		[...vitalsKeys.trends(), patientId, params] as const,
};

/**
 * Hook to list vitals for a patient with pagination and filters
 */
export function usePatientVitals(
	patientId: string,
	params: ListVitalsParams = {},
) {
	return useQuery({
		queryKey: vitalsKeys.list(patientId, params),
		queryFn: () => vitalsClient.listVitals(patientId, params),
		enabled: !!patientId,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
}

/**
 * Hook to get vitals by ID
 */
export function useVitals(id: string) {
	return useQuery({
		queryKey: vitalsKeys.detail(id),
		queryFn: () => vitalsClient.getVitalsById(id),
		enabled: !!id,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
}

/**
 * Hook to get latest vitals for a patient
 */
export function useLatestVitals(patientId: string) {
	return useQuery({
		queryKey: vitalsKeys.latestByPatient(patientId),
		queryFn: () => vitalsClient.getLatestVitals(patientId),
		enabled: !!patientId,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
}

/**
 * Hook to get vitals trends for a patient
 */
export function useVitalsTrends(patientId: string, params: TrendsParams) {
	return useQuery({
		queryKey: vitalsKeys.trend(patientId, params),
		queryFn: () => vitalsClient.getVitalsTrends(patientId, params),
		enabled: !!patientId && !!params.parameter,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

/**
 * Hook for recording new vitals
 */
export function useRecordVitals() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: RecordVitalsInput) => vitalsClient.recordVitals(input),
		onSuccess: (data) => {
			// Invalidate vitals lists and latest for the patient
			queryClient.invalidateQueries({ queryKey: vitalsKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: vitalsKeys.latestByPatient(data.patientId),
			});
			queryClient.invalidateQueries({ queryKey: vitalsKeys.trends() });
		},
	});
}

/**
 * Hook for updating vitals (notes only)
 */
export function useUpdateVitals() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateVitalsInput }) =>
			vitalsClient.updateVitals({ id, data }),
		onSuccess: (_, variables) => {
			// Invalidate specific vitals and lists
			queryClient.invalidateQueries({
				queryKey: vitalsKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: vitalsKeys.lists() });
		},
	});
}

// Re-export types for convenience
export type {
	AlertSeverity,
	ApiError,
	BloodGlucose,
	BloodGlucoseTiming,
	BloodGlucoseUnit,
	BloodPressure,
	GetVitalsByIdOutput,
	Height,
	HeightUnit,
	LatestVitalsOutput,
	LatestVitalsSummary,
	ListVitalsOutput,
	ListVitalsParams,
	PatientBasicInfo,
	RecordVitalsInput,
	RecordVitalsOutput,
	StaffBasicInfo,
	Temperature,
	TemperatureUnit,
	TrendDataPoint,
	TrendStatistics,
	TrendsParams,
	TrendsVitalsOutput,
	UpdateVitalsInput,
	UpdateVitalsOutput,
	VitalAlert,
	VitalParameter,
	VitalsRecordOutput,
	Weight,
	WeightUnit,
} from "../lib/vitals-client";
