import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowLeft,
	Calendar,
	Check,
	Clock,
	FileText,
	Loader2,
	LogIn,
	Phone,
	Stethoscope,
	User,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	type AppointmentStatus,
	useAppointment,
	useCancelAppointment,
	useCheckInAppointment,
	useCompleteAppointment,
} from "@/hooks/use-appointments";
import type { ApiError } from "@/lib/appointments-client";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/appointments/$id")({
	component: AppointmentDetailPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function getStatusBadgeVariant(
	status: AppointmentStatus,
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "SCHEDULED":
		case "CONFIRMED":
			return "secondary";
		case "CHECKED_IN":
		case "IN_PROGRESS":
			return "default";
		case "COMPLETED":
			return "outline";
		case "CANCELLED":
		case "NO_SHOW":
			return "destructive";
		default:
			return "secondary";
	}
}

function getPriorityBadgeVariant(
	priority: string,
): "default" | "secondary" | "destructive" | "outline" {
	switch (priority) {
		case "EMERGENCY":
			return "destructive";
		case "URGENT":
			return "default";
		default:
			return "outline";
	}
}

function AppointmentDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const { data: appointment, isLoading, error } = useAppointment(id);

	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
	const [completeNotes, setCompleteNotes] = useState("");
	const [followUpRequired, setFollowUpRequired] = useState(false);
	const [followUpDate, setFollowUpDate] = useState("");

	const checkInMutation = useCheckInAppointment();
	const completeMutation = useCompleteAppointment();
	const cancelMutation = useCancelAppointment();

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatTime = (time: string) => {
		const [hours, minutes] = time.split(":");
		const hour = Number.parseInt(hours, 10);
		const ampm = hour >= 12 ? "PM" : "AM";
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const handleCheckIn = async () => {
		if (!appointment) return;
		try {
			const result = await checkInMutation.mutateAsync(appointment.id);
			toast.success(`Patient checked in. Queue number: #${result.queueNumber}`);
		} catch (error) {
			const apiError = error as ApiError;
			toast.error(apiError.message || "Failed to check in patient");
		}
	};

	const handleCompleteClick = () => {
		setCompleteDialogOpen(true);
	};

	const handleCompleteConfirm = async () => {
		if (!appointment) return;
		try {
			await completeMutation.mutateAsync({
				id: appointment.id,
				data: {
					notes: completeNotes || undefined,
					followUpRequired,
					followUpDate: followUpDate || undefined,
				},
			});
			toast.success("Appointment completed successfully");
			setCompleteDialogOpen(false);
			setCompleteNotes("");
			setFollowUpRequired(false);
			setFollowUpDate("");
		} catch (error) {
			const apiError = error as ApiError;
			toast.error(apiError.message || "Failed to complete appointment");
		}
	};

	const handleCancelClick = () => {
		setCancelDialogOpen(true);
	};

	const handleCancelConfirm = async () => {
		if (!appointment) return;
		try {
			await cancelMutation.mutateAsync({ id: appointment.id });
			toast.success("Appointment cancelled successfully");
			setCancelDialogOpen(false);
			navigate({ to: "/dashboard/appointments" });
		} catch (error) {
			const apiError = error as ApiError;
			toast.error(apiError.message || "Failed to cancel appointment");
		}
	};

	const canCheckIn = (status: AppointmentStatus) => {
		return status === "SCHEDULED" || status === "CONFIRMED";
	};

	const canComplete = (status: AppointmentStatus) => {
		return status === "CHECKED_IN" || status === "IN_PROGRESS";
	};

	const canCancel = (status: AppointmentStatus) => {
		return (
			status === "SCHEDULED" ||
			status === "CONFIRMED" ||
			status === "CHECKED_IN"
		);
	};

	if (isLoading) {
		return (
			<div className="flex h-96 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !appointment) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-foreground">Appointment not found</p>
				<Button variant="outline" asChild>
					<Link to="/dashboard/appointments">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Appointments
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<>
			<div className="flex flex-col gap-6 p-4 md:p-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="icon" asChild>
							<Link to="/dashboard/appointments">
								<ArrowLeft className="h-4 w-4" />
							</Link>
						</Button>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="font-bold text-2xl">
									{appointment.appointmentNumber}
								</h1>
								<Badge variant={getStatusBadgeVariant(appointment.status)}>
									{appointment.status.replace("_", " ")}
								</Badge>
								{appointment.priority !== "NORMAL" && (
									<Badge
										variant={getPriorityBadgeVariant(appointment.priority)}
									>
										{appointment.priority === "EMERGENCY" && (
											<AlertTriangle className="mr-1 h-3 w-3" />
										)}
										{appointment.priority}
									</Badge>
								)}
							</div>
							<p className="text-muted-foreground">
								{appointment.type.replace("_", " ")} Appointment
							</p>
						</div>
					</div>
					<div className="flex gap-2">
						{canCheckIn(appointment.status) && (
							<Button
								onClick={handleCheckIn}
								disabled={checkInMutation.isPending}
							>
								{checkInMutation.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<LogIn className="mr-2 h-4 w-4" />
								)}
								Check In
							</Button>
						)}
						{canComplete(appointment.status) && (
							<Button onClick={handleCompleteClick}>
								<Check className="mr-2 h-4 w-4" />
								Complete
							</Button>
						)}
						{canCancel(appointment.status) && (
							<Button variant="destructive" onClick={handleCancelClick}>
								<X className="mr-2 h-4 w-4" />
								Cancel
							</Button>
						)}
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					{/* Patient Information */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="h-5 w-5" />
								Patient Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label className="text-muted-foreground text-sm">Name</Label>
								<p className="font-medium">
									{appointment.patient.firstName} {appointment.patient.lastName}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">
									Patient ID
								</Label>
								<p className="font-mono">{appointment.patient.patientId}</p>
							</div>
							{appointment.patient.phone && (
								<div>
									<Label className="text-muted-foreground text-sm">Phone</Label>
									<p className="flex items-center gap-2">
										<Phone className="h-4 w-4 text-muted-foreground" />
										{appointment.patient.phone}
									</p>
								</div>
							)}
							<Button variant="outline" className="w-full" asChild>
								<Link
									to="/dashboard/patients/$id"
									params={{ id: appointment.patient.id }}
								>
									View Patient Profile
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Doctor Information */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Stethoscope className="h-5 w-5" />
								Doctor Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label className="text-muted-foreground text-sm">Name</Label>
								<p className="font-medium">
									Dr. {appointment.doctor.firstName}{" "}
									{appointment.doctor.lastName}
								</p>
							</div>
							{appointment.doctor.specialization && (
								<div>
									<Label className="text-muted-foreground text-sm">
										Specialization
									</Label>
									<p>{appointment.doctor.specialization}</p>
								</div>
							)}
							<div>
								<Label className="text-muted-foreground text-sm">
									Department
								</Label>
								<p>{appointment.department.name}</p>
							</div>
						</CardContent>
					</Card>

					{/* Appointment Details */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								Appointment Details
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label className="text-muted-foreground text-sm">Date</Label>
								<p className="font-medium">{formatDate(appointment.date)}</p>
							</div>
							<div>
								<Label className="text-muted-foreground text-sm">Time</Label>
								<p className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-muted-foreground" />
									{formatTime(appointment.timeSlot.start)} -{" "}
									{formatTime(appointment.timeSlot.end)}
								</p>
							</div>
							{appointment.queueNumber && (
								<div>
									<Label className="text-muted-foreground text-sm">
										Queue Number
									</Label>
									<Badge variant="secondary" className="font-mono text-lg">
										#{appointment.queueNumber}
									</Badge>
								</div>
							)}
							{appointment.reason && (
								<div>
									<Label className="text-muted-foreground text-sm">
										Reason for Visit
									</Label>
									<p>{appointment.reason}</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Notes & Follow-up */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Notes & Follow-up
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{appointment.notes ? (
								<div>
									<Label className="text-muted-foreground text-sm">Notes</Label>
									<p className="whitespace-pre-wrap">{appointment.notes}</p>
								</div>
							) : (
								<p className="text-muted-foreground text-sm">No notes added</p>
							)}
							{appointment.followUpRequired && (
								<div>
									<Label className="text-muted-foreground text-sm">
										Follow-up Required
									</Label>
									<p className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-500" />
										Yes
										{appointment.followUpDate && (
											<span className="text-muted-foreground">
												- {formatDate(appointment.followUpDate)}
											</span>
										)}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Timeline */}
				<Card>
					<CardHeader>
						<CardTitle>Timeline</CardTitle>
						<CardDescription>Appointment status history</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-start gap-4">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
									<Calendar className="h-4 w-4" />
								</div>
								<div>
									<p className="font-medium">Appointment Created</p>
									<p className="text-muted-foreground text-sm">
										{formatDateTime(appointment.createdAt)}
									</p>
								</div>
							</div>

							{appointment.checkedInAt && (
								<div className="flex items-start gap-4">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
										<LogIn className="h-4 w-4 text-blue-600 dark:text-blue-400" />
									</div>
									<div>
										<p className="font-medium">Patient Checked In</p>
										<p className="text-muted-foreground text-sm">
											{formatDateTime(appointment.checkedInAt)}
										</p>
									</div>
								</div>
							)}

							{appointment.completedAt && (
								<div className="flex items-start gap-4">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
										<Check className="h-4 w-4 text-green-600 dark:text-green-400" />
									</div>
									<div>
										<p className="font-medium">Appointment Completed</p>
										<p className="text-muted-foreground text-sm">
											{formatDateTime(appointment.completedAt)}
										</p>
									</div>
								</div>
							)}

							{appointment.cancelledAt && (
								<div className="flex items-start gap-4">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
										<X className="h-4 w-4 text-red-600 dark:text-red-400" />
									</div>
									<div>
										<p className="font-medium">Appointment Cancelled</p>
										<p className="text-muted-foreground text-sm">
											{formatDateTime(appointment.cancelledAt)}
										</p>
										{appointment.cancellationReason && (
											<p className="mt-1 text-sm">
												Reason: {appointment.cancellationReason}
											</p>
										)}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Complete Appointment Dialog */}
			<AlertDialog
				open={completeDialogOpen}
				onOpenChange={setCompleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Complete Appointment</AlertDialogTitle>
						<AlertDialogDescription>
							Add any notes and specify if follow-up is required.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="complete-notes">Notes (optional)</Label>
							<Textarea
								id="complete-notes"
								value={completeNotes}
								onChange={(e) => setCompleteNotes(e.target.value)}
								placeholder="Add appointment notes..."
								rows={3}
							/>
						</div>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="follow-up"
								checked={followUpRequired}
								onChange={(e) => setFollowUpRequired(e.target.checked)}
								className="h-4 w-4 rounded border-gray-300"
							/>
							<Label htmlFor="follow-up">Follow-up Required</Label>
						</div>
						{followUpRequired && (
							<div className="space-y-2">
								<Label htmlFor="follow-up-date">Follow-up Date</Label>
								<input
									type="date"
									id="follow-up-date"
									value={followUpDate}
									onChange={(e) => setFollowUpDate(e.target.value)}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								/>
							</div>
						)}
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCompleteConfirm}
							disabled={completeMutation.isPending}
						>
							{completeMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Completing...
								</>
							) : (
								"Complete Appointment"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Cancel Confirmation Dialog */}
			<AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel appointment{" "}
							<span className="font-medium">
								{appointment.appointmentNumber}
							</span>
							? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Keep Appointment</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancelConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{cancelMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Cancelling...
								</>
							) : (
								"Cancel Appointment"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
