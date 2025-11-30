import { useForm } from "@tanstack/react-form";
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
	CalendarPlus,
	Clock,
	Loader2,
	Search,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	type AppointmentPriority,
	type AppointmentType,
	useCreateAppointment,
	useDoctorAvailability,
} from "@/hooks/use-appointments";
import { useDepartments } from "@/hooks/use-departments";
import { useSearchPatients } from "@/hooks/use-patients";
import { useUsers } from "@/hooks/use-users";
import type { ApiError } from "@/lib/appointments-client";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/appointments/schedule")({
	component: ScheduleAppointmentPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

const TYPE_OPTIONS: { value: AppointmentType; label: string }[] = [
	{ value: "CONSULTATION", label: "Consultation" },
	{ value: "FOLLOW_UP", label: "Follow Up" },
	{ value: "PROCEDURE", label: "Procedure" },
	{ value: "EMERGENCY", label: "Emergency" },
	{ value: "ROUTINE_CHECK", label: "Routine Check" },
];

const PRIORITY_OPTIONS: { value: AppointmentPriority; label: string }[] = [
	{ value: "NORMAL", label: "Normal" },
	{ value: "URGENT", label: "Urgent" },
	{ value: "EMERGENCY", label: "Emergency" },
];

function ScheduleAppointmentPage() {
	const navigate = useNavigate();
	const [patientSearch, setPatientSearch] = useState("");
	const [selectedPatient, setSelectedPatient] = useState<{
		id: string;
		patientId: string;
		firstName: string;
		lastName: string;
	} | null>(null);
	const [selectedDepartment, setSelectedDepartment] = useState("");
	const [selectedDoctor, setSelectedDoctor] = useState("");
	const [selectedDate, setSelectedDate] = useState("");
	const [showPatientDropdown, setShowPatientDropdown] = useState(false);

	// Fetch departments
	const { data: departmentsData } = useDepartments({});

	// Fetch doctors filtered by department
	const { data: usersData } = useUsers({
		role: "DOCTOR",
		department: selectedDepartment || undefined,
		status: "ACTIVE",
	});

	// Search patients
	const { data: patientResults, isLoading: searchingPatients } =
		useSearchPatients({
			q: patientSearch,
			limit: 10,
		});

	// Fetch doctor availability
	const { data: availability, isLoading: loadingAvailability } =
		useDoctorAvailability(selectedDoctor, selectedDate);

	const createAppointmentMutation = useCreateAppointment();

	// Get available time slots
	const availableSlots =
		availability?.slots.filter((slot) => slot.available) ?? [];

	const form = useForm({
		defaultValues: {
			patientId: "",
			doctorId: "",
			departmentId: "",
			date: "",
			timeSlotStart: "",
			timeSlotEnd: "",
			type: "" as AppointmentType | "",
			priority: "NORMAL" as AppointmentPriority,
			reason: "",
			notes: "",
		},
		onSubmit: async ({ value }) => {
			if (!selectedPatient) {
				toast.error("Please select a patient");
				return;
			}

			if (!value.doctorId) {
				toast.error("Please select a doctor");
				return;
			}

			if (!value.departmentId) {
				toast.error("Please select a department");
				return;
			}

			if (!value.date) {
				toast.error("Please select a date");
				return;
			}

			if (!value.timeSlotStart || !value.timeSlotEnd) {
				toast.error("Please select a time slot");
				return;
			}

			if (!value.type) {
				toast.error("Please select appointment type");
				return;
			}

			try {
				const result = await createAppointmentMutation.mutateAsync({
					patientId: selectedPatient.id,
					doctorId: value.doctorId,
					departmentId: value.departmentId,
					date: new Date(value.date).toISOString(),
					timeSlot: {
						start: value.timeSlotStart,
						end: value.timeSlotEnd,
					},
					type: value.type as AppointmentType,
					priority: value.priority,
					reason: value.reason || undefined,
					notes: value.notes || undefined,
				});
				toast.success(
					`Appointment scheduled successfully. Appointment #: ${result.appointmentNumber}`,
				);
				navigate({ to: "/dashboard/appointments" });
			} catch (error) {
				const apiError = error as ApiError;
				toast.error(apiError.message || "Failed to schedule appointment");
			}
		},
	});

	// Update form when patient is selected
	useEffect(() => {
		if (selectedPatient) {
			form.setFieldValue("patientId", selectedPatient.id);
		}
	}, [selectedPatient, form]);

	// Update form when department changes
	useEffect(() => {
		form.setFieldValue("departmentId", selectedDepartment);
		// Reset doctor when department changes
		setSelectedDoctor("");
		form.setFieldValue("doctorId", "");
	}, [selectedDepartment, form]);

	// Update form when doctor changes
	useEffect(() => {
		form.setFieldValue("doctorId", selectedDoctor);
	}, [selectedDoctor, form]);

	// Update form when date changes
	useEffect(() => {
		form.setFieldValue("date", selectedDate);
		// Reset time slot when date changes
		form.setFieldValue("timeSlotStart", "");
		form.setFieldValue("timeSlotEnd", "");
	}, [selectedDate, form]);

	const handlePatientSelect = (patient: {
		id: string;
		patientId: string;
		firstName: string;
		lastName: string;
	}) => {
		setSelectedPatient(patient);
		setPatientSearch(`${patient.firstName} ${patient.lastName}`);
		setShowPatientDropdown(false);
	};

	const handleTimeSlotSelect = (start: string, end: string) => {
		form.setFieldValue("timeSlotStart", start);
		form.setFieldValue("timeSlotEnd", end);
	};

	const formatTime = (time: string) => {
		const [hours, minutes] = time.split(":");
		const hour = Number.parseInt(hours, 10);
		const ampm = hour >= 12 ? "PM" : "AM";
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	};

	const getTodayDate = () => {
		const today = new Date();
		return today.toISOString().split("T")[0];
	};

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/dashboard/appointments">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-2xl">Schedule Appointment</h1>
					<p className="text-muted-foreground">
						Create a new appointment for a patient
					</p>
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="grid gap-6 md:grid-cols-2"
			>
				{/* Patient Selection */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Patient
						</CardTitle>
						<CardDescription>Search and select a patient</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="relative">
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search by name, phone, or patient ID..."
									value={patientSearch}
									onChange={(e) => {
										setPatientSearch(e.target.value);
										setShowPatientDropdown(true);
										if (!e.target.value) {
											setSelectedPatient(null);
										}
									}}
									onFocus={() => setShowPatientDropdown(true)}
									className="pl-9"
								/>
							</div>

							{/* Patient Search Results Dropdown */}
							{showPatientDropdown &&
								patientSearch.length >= 2 &&
								(searchingPatients ||
									(patientResults && patientResults.length > 0)) && (
									<div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-lg">
										{searchingPatients ? (
											<div className="flex items-center justify-center py-4">
												<Loader2 className="h-4 w-4 animate-spin" />
											</div>
										) : (
											patientResults?.map((patient) => (
												<button
													key={patient.id}
													type="button"
													className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
													onClick={() => handlePatientSelect(patient)}
												>
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
														<User className="h-4 w-4" />
													</div>
													<div>
														<p className="font-medium">
															{patient.firstName} {patient.lastName}
														</p>
														<p className="text-muted-foreground text-xs">
															{patient.patientId} | {patient.phone}
														</p>
													</div>
												</button>
											))
										)}
									</div>
								)}
						</div>

						{selectedPatient && (
							<div className="flex items-center gap-3 rounded-md border bg-secondary/50 p-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
									<User className="h-5 w-5" />
								</div>
								<div>
									<p className="font-medium">
										{selectedPatient.firstName} {selectedPatient.lastName}
									</p>
									<p className="text-muted-foreground text-sm">
										{selectedPatient.patientId}
									</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="ml-auto"
									onClick={() => {
										setSelectedPatient(null);
										setPatientSearch("");
									}}
								>
									Change
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Department & Doctor */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							Department & Doctor
						</CardTitle>
						<CardDescription>
							Select department and available doctor
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Department *</Label>
							<Select
								value={selectedDepartment}
								onValueChange={setSelectedDepartment}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select department" />
								</SelectTrigger>
								<SelectContent>
									{departmentsData?.data.map((dept) => (
										<SelectItem key={dept.id} value={dept.id}>
											{dept.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Doctor *</Label>
							<Select
								value={selectedDoctor}
								onValueChange={setSelectedDoctor}
								disabled={!selectedDepartment}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={
											selectedDepartment
												? "Select doctor"
												: "Select department first"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{usersData?.data.map((user) => (
										<SelectItem key={user.id} value={user.id}>
											Dr. {user.firstName} {user.lastName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Date & Time */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="h-5 w-5" />
							Date & Time
						</CardTitle>
						<CardDescription>
							Choose appointment date and available time slot
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Date *</Label>
							<Input
								type="date"
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								min={getTodayDate()}
								disabled={!selectedDoctor}
							/>
						</div>

						{selectedDoctor && selectedDate && (
							<div className="space-y-2">
								<Label>Available Time Slots</Label>
								{loadingAvailability ? (
									<div className="flex items-center justify-center py-4">
										<Loader2 className="h-4 w-4 animate-spin" />
									</div>
								) : availableSlots.length > 0 ? (
									<div className="grid grid-cols-3 gap-2">
										{availableSlots.map((slot) => (
											<form.Field key={slot.start} name="timeSlotStart">
												{(field) => (
													<Button
														type="button"
														variant={
															field.state.value === slot.start
																? "default"
																: "outline"
														}
														size="sm"
														onClick={() =>
															handleTimeSlotSelect(slot.start, slot.end)
														}
													>
														{formatTime(slot.start)}
													</Button>
												)}
											</form.Field>
										))}
									</div>
								) : (
									<p className="text-muted-foreground text-sm">
										No available slots for this date
									</p>
								)}
							</div>
						)}

						<form.Field name="timeSlotStart">
							{(field) =>
								field.state.value && (
									<div className="flex items-center gap-2 text-sm">
										<Clock className="h-4 w-4 text-muted-foreground" />
										Selected: {formatTime(field.state.value)} -{" "}
										{formatTime(form.getFieldValue("timeSlotEnd"))}
									</div>
								)
							}
						</form.Field>
					</CardContent>
				</Card>

				{/* Appointment Details */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CalendarPlus className="h-5 w-5" />
							Appointment Details
						</CardTitle>
						<CardDescription>
							Specify type, priority, and reason
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field name="type">
							{(field) => (
								<div className="space-y-2">
									<Label>Type *</Label>
									<Select
										value={field.state.value}
										onValueChange={(value) =>
											field.handleChange(value as AppointmentType)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select appointment type" />
										</SelectTrigger>
										<SelectContent>
											{TYPE_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						<form.Field name="priority">
							{(field) => (
								<div className="space-y-2">
									<Label>Priority</Label>
									<Select
										value={field.state.value}
										onValueChange={(value) =>
											field.handleChange(value as AppointmentPriority)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{PRIORITY_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													<div className="flex items-center gap-2">
														{option.value === "EMERGENCY" && (
															<AlertTriangle className="h-4 w-4 text-destructive" />
														)}
														{option.label}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						<form.Field name="reason">
							{(field) => (
								<div className="space-y-2">
									<Label>Reason for Visit</Label>
									<Textarea
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Brief description of the visit reason..."
										rows={2}
									/>
								</div>
							)}
						</form.Field>

						<form.Field name="notes">
							{(field) => (
								<div className="space-y-2">
									<Label>Additional Notes</Label>
									<Textarea
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Any additional notes or instructions..."
										rows={2}
									/>
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				{/* Submit */}
				<div className="md:col-span-2">
					<div className="flex justify-end gap-4">
						<Button type="button" variant="outline" asChild>
							<Link to="/dashboard/appointments">Cancel</Link>
						</Button>
						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									disabled={
										state.isSubmitting ||
										createAppointmentMutation.isPending ||
										!selectedPatient
									}
								>
									{state.isSubmitting || createAppointmentMutation.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Scheduling...
										</>
									) : (
										<>
											<CalendarPlus className="mr-2 h-4 w-4" />
											Schedule Appointment
										</>
									)}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</div>
			</form>
		</div>
	);
}
