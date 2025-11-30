/**
 * React hooks for appointments client using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	appointmentsClient,
	type CompleteAppointmentInput,
	type CreateAppointmentInput,
	type ListAppointmentsParams,
	type QueueParams,
	type UpdateAppointmentInput,
} from "../lib/appointments-client";

// Query keys
export const appointmentsKeys = {
	all: ["appointments"] as const,
	lists: () => [...appointmentsKeys.all, "list"] as const,
	list: (params: ListAppointmentsParams) =>
		[...appointmentsKeys.lists(), params] as const,
	details: () => [...appointmentsKeys.all, "detail"] as const,
	detail: (id: string) => [...appointmentsKeys.details(), id] as const,
	availability: (doctorId: string, date: string) =>
		[...appointmentsKeys.all, "availability", doctorId, date] as const,
	queues: () => [...appointmentsKeys.all, "queue"] as const,
	queue: (params: QueueParams) =>
		[...appointmentsKeys.queues(), params] as const,
};

/**
 * Hook to list appointments with pagination and filters
 */
export function useAppointments(params: ListAppointmentsParams = {}) {
	return useQuery({
		queryKey: appointmentsKeys.list(params),
		queryFn: () => appointmentsClient.listAppointments(params),
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
}

/**
 * Hook to get appointment by ID
 */
export function useAppointment(id: string) {
	return useQuery({
		queryKey: appointmentsKeys.detail(id),
		queryFn: () => appointmentsClient.getAppointmentById(id),
		enabled: !!id,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
}

/**
 * Hook to get doctor availability for a specific date
 */
export function useDoctorAvailability(doctorId: string, date: string) {
	return useQuery({
		queryKey: appointmentsKeys.availability(doctorId, date),
		queryFn: () => appointmentsClient.getDoctorAvailability({ doctorId, date }),
		enabled: !!doctorId && !!date,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

/**
 * Hook to get the OPD queue
 */
export function useAppointmentQueue(params: QueueParams = {}) {
	return useQuery({
		queryKey: appointmentsKeys.queue(params),
		queryFn: () => appointmentsClient.getQueue(params),
		staleTime: 1000 * 30, // 30 seconds - queue changes frequently
		refetchInterval: 1000 * 60, // Refetch every minute
	});
}

/**
 * Hook for creating a new appointment
 */
export function useCreateAppointment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateAppointmentInput) =>
			appointmentsClient.createAppointment(input),
		onSuccess: () => {
			// Invalidate appointments list to refetch
			queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: appointmentsKeys.queues() });
		},
	});
}

/**
 * Hook for updating an appointment
 */
export function useUpdateAppointment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentInput }) =>
			appointmentsClient.updateAppointment({ id, data }),
		onSuccess: (_, variables) => {
			// Invalidate specific appointment and lists
			queryClient.invalidateQueries({
				queryKey: appointmentsKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
		},
	});
}

/**
 * Hook for cancelling an appointment
 */
export function useCancelAppointment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
			appointmentsClient.cancelAppointment({ id, reason }),
		onSuccess: (_, variables) => {
			// Invalidate specific appointment and lists
			queryClient.invalidateQueries({
				queryKey: appointmentsKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: appointmentsKeys.queues() });
		},
	});
}

/**
 * Hook for checking in a patient
 */
export function useCheckInAppointment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => appointmentsClient.checkInAppointment(id),
		onSuccess: (_, id) => {
			// Invalidate specific appointment and lists
			queryClient.invalidateQueries({
				queryKey: appointmentsKeys.detail(id),
			});
			queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: appointmentsKeys.queues() });
		},
	});
}

/**
 * Hook for completing an appointment
 */
export function useCompleteAppointment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data?: CompleteAppointmentInput;
		}) => appointmentsClient.completeAppointment({ id, data }),
		onSuccess: (_, variables) => {
			// Invalidate specific appointment and lists
			queryClient.invalidateQueries({
				queryKey: appointmentsKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: appointmentsKeys.queues() });
		},
	});
}

// Re-export types for convenience
export type {
	ApiError,
	AppointmentDetails,
	AppointmentListItem,
	AppointmentPriority,
	AppointmentStatus,
	AppointmentType,
	AvailabilitySlot,
	CancelAppointmentInput,
	CheckInResponse,
	CompleteAppointmentInput,
	CompleteAppointmentResponse,
	CreateAppointmentInput,
	CreateAppointmentResponse,
	DepartmentInfo,
	DoctorAvailabilityResponse,
	DoctorInfo,
	ListAppointmentsParams,
	ListAppointmentsResponse,
	PatientInfo,
	QueueItem,
	QueueParams,
	QueueResponse,
	TimeSlot,
	UpdateAppointmentInput,
} from "../lib/appointments-client";
