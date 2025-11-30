import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import {
	Activity,
	AlertTriangle,
	ArrowLeft,
	Calendar,
	Clock,
	Edit,
	Heart,
	Loader2,
	Save,
	Stethoscope,
	Thermometer,
	User,
	Wind,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	useUpdateVitals,
	useVitals,
	type VitalAlert,
} from "@/hooks/use-vitals";
import { authClient } from "@/lib/auth-client";
import type { ApiError } from "@/lib/vitals-client";

export const Route = createFileRoute("/dashboard/vitals/$id")({
	component: VitalsDetailPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function VitalsDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams({ from: "/dashboard/vitals/$id" });
	const { data: vitals, isLoading } = useVitals(id);
	const updateVitalsMutation = useUpdateVitals();

	const [isEditing, setIsEditing] = useState(false);

	const form = useForm({
		defaultValues: {
			notes: vitals?.notes || "",
			correctionReason: "",
		},
		onSubmit: async ({ value }) => {
			try {
				await updateVitalsMutation.mutateAsync({
					id,
					data: {
						notes: value.notes || undefined,
						correctionReason: value.correctionReason,
					},
				});
				toast.success("Vitals updated successfully");
				setIsEditing(false);
			} catch (error) {
				const apiError = error as ApiError;
				toast.error(apiError.message || "Failed to update vitals");
			}
		},
		validators: {
			onSubmit: z.object({
				notes: z.string(),
				correctionReason: z.string().min(1, "Correction reason is required"),
			}),
		},
	});

	// Update form when vitals data loads
	if (vitals && !form.state.values.notes && vitals.notes) {
		form.setFieldValue("notes", vitals.notes);
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getSeverityVariant = (
		severity: string,
	): "default" | "secondary" | "destructive" | "outline" => {
		switch (severity) {
			case "CRITICAL":
				return "destructive";
			case "HIGH":
				return "destructive";
			case "MEDIUM":
				return "secondary";
			default:
				return "outline";
		}
	};

	const getSeverityColor = (severity: string): string => {
		switch (severity) {
			case "CRITICAL":
				return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-900";
			case "HIGH":
				return "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-900";
			case "MEDIUM":
				return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-900";
			default:
				return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-900";
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!vitals) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 p-8">
				<h2 className="font-semibold text-xl">Vitals record not found</h2>
				<Button onClick={() => navigate({ to: "/dashboard" })}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Dashboard
				</Button>
			</div>
		);
	}

	const hasAlerts = vitals.alerts && vitals.alerts.length > 0;
	const criticalAlerts = vitals.alerts?.filter(
		(a) => a.severity === "CRITICAL" || a.severity === "HIGH",
	);

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate({ to: "/dashboard/vitals/history" })}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="font-bold text-2xl">Vitals Record</h1>
							{hasAlerts && (
								<Badge
									variant={
										criticalAlerts && criticalAlerts.length > 0
											? "destructive"
											: "secondary"
									}
								>
									<AlertTriangle className="mr-1 h-3 w-3" />
									{vitals.alerts?.length} Alert
									{(vitals.alerts?.length ?? 0) > 1 ? "s" : ""}
								</Badge>
							)}
						</div>
						<p className="text-muted-foreground">
							{vitals.patient.firstName} {vitals.patient.lastName} (
							{vitals.patient.patientId})
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link
							to="/dashboard/vitals/history"
							search={{ patientId: vitals.patient.id }}
						>
							View History
						</Link>
					</Button>
					<Button asChild>
						<Link to="/dashboard/vitals/record">
							<Activity className="mr-2 h-4 w-4" />
							Record New
						</Link>
					</Button>
				</div>
			</div>

			{/* Alerts Section */}
			{hasAlerts && (
				<Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
							<AlertTriangle className="h-5 w-5" />
							Vitals Alerts
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{vitals.alerts?.map((alert: VitalAlert, index: number) => (
								<div
									key={`${alert.parameter}-${index}`}
									className={`rounded-lg border p-3 ${getSeverityColor(alert.severity)}`}
								>
									<div className="flex items-center justify-between">
										<span className="font-medium capitalize">
											{alert.parameter.replace(/([A-Z])/g, " $1").trim()}
										</span>
										<Badge variant={getSeverityVariant(alert.severity)}>
											{alert.severity}
										</Badge>
									</div>
									<div className="mt-1 text-sm">
										<span className="font-semibold">{alert.value}</span>
										{alert.normalRange && (
											<span className="opacity-75">
												{" "}
												(Normal: {alert.normalRange.min}-{alert.normalRange.max}
												)
											</span>
										)}
									</div>
									<div className="mt-1 text-xs opacity-75">{alert.type}</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Vitals Card */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Vital Signs
						</CardTitle>
						<CardDescription>
							Recorded on {formatDate(vitals.recordedAt)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{/* Temperature */}
							{vitals.temperature && (
								<div className="rounded-lg border p-4">
									<div className="flex items-center gap-2 text-muted-foreground">
										<Thermometer className="h-4 w-4" />
										<span className="text-sm">Temperature</span>
									</div>
									<div className="mt-2 font-bold text-2xl">
										{vitals.temperature.value}°
										{vitals.temperature.unit === "CELSIUS" ? "C" : "F"}
									</div>
								</div>
							)}

							{/* Blood Pressure */}
							{vitals.bloodPressure && (
								<div className="rounded-lg border p-4">
									<div className="flex items-center gap-2 text-muted-foreground">
										<Heart className="h-4 w-4" />
										<span className="text-sm">Blood Pressure</span>
									</div>
									<div className="mt-2 font-bold text-2xl">
										{vitals.bloodPressure.systolic}/
										{vitals.bloodPressure.diastolic}
										<span className="font-normal text-muted-foreground text-sm">
											{" "}
											mmHg
										</span>
									</div>
								</div>
							)}

							{/* Heart Rate */}
							{vitals.heartRate && (
								<div className="rounded-lg border p-4">
									<div className="flex items-center gap-2 text-muted-foreground">
										<Activity className="h-4 w-4" />
										<span className="text-sm">Heart Rate</span>
									</div>
									<div className="mt-2 font-bold text-2xl">
										{vitals.heartRate}
										<span className="font-normal text-muted-foreground text-sm">
											{" "}
											bpm
										</span>
									</div>
								</div>
							)}

							{/* Respiratory Rate */}
							{vitals.respiratoryRate && (
								<div className="rounded-lg border p-4">
									<div className="flex items-center gap-2 text-muted-foreground">
										<Wind className="h-4 w-4" />
										<span className="text-sm">Respiratory Rate</span>
									</div>
									<div className="mt-2 font-bold text-2xl">
										{vitals.respiratoryRate}
										<span className="font-normal text-muted-foreground text-sm">
											{" "}
											/min
										</span>
									</div>
								</div>
							)}

							{/* Oxygen Saturation */}
							{vitals.oxygenSaturation && (
								<div className="rounded-lg border p-4">
									<div className="flex items-center gap-2 text-muted-foreground">
										<Stethoscope className="h-4 w-4" />
										<span className="text-sm">O2 Saturation</span>
									</div>
									<div className="mt-2 font-bold text-2xl">
										{vitals.oxygenSaturation}
										<span className="font-normal text-muted-foreground text-sm">
											{" "}
											%
										</span>
									</div>
								</div>
							)}

							{/* Weight */}
							{vitals.weight && (
								<div className="rounded-lg border p-4">
									<div className="flex items-center gap-2 text-muted-foreground">
										<User className="h-4 w-4" />
										<span className="text-sm">Weight</span>
									</div>
									<div className="mt-2 font-bold text-2xl">
										{vitals.weight.value}
										<span className="font-normal text-muted-foreground text-sm">
											{" "}
											{vitals.weight.unit === "KG" ? "kg" : "lb"}
										</span>
									</div>
								</div>
							)}

							{/* Height */}
							{vitals.height && (
								<div className="rounded-lg border p-4">
									<div className="flex items-center gap-2 text-muted-foreground">
										<User className="h-4 w-4" />
										<span className="text-sm">Height</span>
									</div>
									<div className="mt-2 font-bold text-2xl">
										{vitals.height.value}
										<span className="font-normal text-muted-foreground text-sm">
											{" "}
											{vitals.height.unit === "CM" ? "cm" : "in"}
										</span>
									</div>
								</div>
							)}

							{/* BMI */}
							{vitals.bmi && (
								<div className="rounded-lg border p-4">
									<div className="flex items-center gap-2 text-muted-foreground">
										<Activity className="h-4 w-4" />
										<span className="text-sm">BMI</span>
									</div>
									<div className="mt-2 font-bold text-2xl">
										{vitals.bmi.toFixed(1)}
									</div>
								</div>
							)}

							{/* Blood Glucose */}
							{vitals.bloodGlucose && (
								<div className="rounded-lg border p-4">
									<div className="flex items-center gap-2 text-muted-foreground">
										<Activity className="h-4 w-4" />
										<span className="text-sm">Blood Glucose</span>
									</div>
									<div className="mt-2 font-bold text-2xl">
										{vitals.bloodGlucose.value}
										<span className="font-normal text-muted-foreground text-sm">
											{" "}
											{vitals.bloodGlucose.unit === "MG_DL"
												? "mg/dL"
												: "mmol/L"}
										</span>
									</div>
									<div className="mt-1 text-muted-foreground text-xs capitalize">
										{vitals.bloodGlucose.timing.toLowerCase()}
									</div>
								</div>
							)}

							{/* Pain Level */}
							{vitals.painLevel !== undefined && vitals.painLevel !== null && (
								<div className="rounded-lg border p-4">
									<div className="flex items-center gap-2 text-muted-foreground">
										<AlertTriangle className="h-4 w-4" />
										<span className="text-sm">Pain Level</span>
									</div>
									<div className="mt-2 font-bold text-2xl">
										{vitals.painLevel}
										<span className="font-normal text-muted-foreground text-sm">
											{" "}
											/ 10
										</span>
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Record Info */}
					<Card>
						<CardHeader>
							<CardTitle>Record Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<div>
									<Label className="text-muted-foreground text-xs">
										Recorded At
									</Label>
									<p className="font-medium">{formatDate(vitals.recordedAt)}</p>
								</div>
							</div>
							<Separator />
							<div className="flex items-center gap-2">
								<User className="h-4 w-4 text-muted-foreground" />
								<div>
									<Label className="text-muted-foreground text-xs">
										Recorded By
									</Label>
									<p className="font-medium">
										{vitals.recordedBy.firstName} {vitals.recordedBy.lastName}
									</p>
								</div>
							</div>
							{vitals.appointment && (
								<>
									<Separator />
									<div className="flex items-center gap-2">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<div>
											<Label className="text-muted-foreground text-xs">
												Appointment
											</Label>
											<p className="font-medium">{vitals.appointment.id}</p>
										</div>
									</div>
								</>
							)}
							{vitals.admission && (
								<>
									<Separator />
									<div className="flex items-center gap-2">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<div>
											<Label className="text-muted-foreground text-xs">
												Admission
											</Label>
											<p className="font-medium">{vitals.admission.id}</p>
										</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Patient Info */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="h-4 w-4" />
								Patient
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="font-medium">
								{vitals.patient.firstName} {vitals.patient.lastName}
							</p>
							<p className="text-muted-foreground text-sm">
								ID: {vitals.patient.patientId}
							</p>
							<Button variant="outline" size="sm" asChild className="mt-2">
								<Link
									to="/dashboard/patients/$id"
									params={{ id: vitals.patient.id }}
								>
									View Patient
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Notes Card */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Notes</CardTitle>
								{!isEditing && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsEditing(true)}
									>
										<Edit className="mr-1 h-4 w-4" />
										Edit
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent>
							{isEditing ? (
								<form
									onSubmit={(e) => {
										e.preventDefault();
										e.stopPropagation();
										form.handleSubmit();
									}}
									className="space-y-4"
								>
									<form.Field name="notes">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Notes</Label>
												<Textarea
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													rows={4}
													placeholder="Add notes about this vitals record..."
												/>
											</div>
										)}
									</form.Field>

									<form.Field name="correctionReason">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Correction Reason *</Label>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="Why are you making this correction?"
												/>
												{field.state.meta.errors.map((error) => (
													<p
														key={String(error)}
														className="text-red-500 text-sm"
													>
														{String(error)}
													</p>
												))}
											</div>
										)}
									</form.Field>

									<div className="flex gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												setIsEditing(false);
												form.reset();
											}}
										>
											<X className="mr-1 h-4 w-4" />
											Cancel
										</Button>
										<form.Subscribe>
											{(state) => (
												<Button
													type="submit"
													size="sm"
													disabled={
														state.isSubmitting || updateVitalsMutation.isPending
													}
												>
													{state.isSubmitting ||
													updateVitalsMutation.isPending ? (
														<>
															<Loader2 className="mr-1 h-4 w-4 animate-spin" />
															Saving...
														</>
													) : (
														<>
															<Save className="mr-1 h-4 w-4" />
															Save
														</>
													)}
												</Button>
											)}
										</form.Subscribe>
									</div>
								</form>
							) : (
								<p className="text-sm">
									{vitals.notes || (
										<span className="text-muted-foreground italic">
											No notes recorded
										</span>
									)}
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
