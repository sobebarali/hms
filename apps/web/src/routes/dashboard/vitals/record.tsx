import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Activity,
	AlertTriangle,
	ArrowLeft,
	Loader2,
	Search,
	User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
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
import { useSearchPatients } from "@/hooks/use-patients";
import { useRecordVitals } from "@/hooks/use-vitals";
import { authClient } from "@/lib/auth-client";
import type { ApiError } from "@/lib/vitals-client";

export const Route = createFileRoute("/dashboard/vitals/record")({
	component: RecordVitalsPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw import("@tanstack/react-router").then((m) =>
				m.redirect({ to: "/login" }),
			);
		}
	},
});

const recordVitalsSchema = z.object({
	patientId: z.string().min(1, "Patient is required"),
	temperatureValue: z.string(),
	temperatureUnit: z.string(),
	systolic: z.string(),
	diastolic: z.string(),
	heartRate: z.string(),
	respiratoryRate: z.string(),
	oxygenSaturation: z.string(),
	weightValue: z.string(),
	weightUnit: z.string(),
	heightValue: z.string(),
	heightUnit: z.string(),
	bloodGlucoseValue: z.string(),
	bloodGlucoseUnit: z.string(),
	bloodGlucoseTiming: z.string(),
	painLevel: z.string(),
	notes: z.string(),
});

function RecordVitalsPage() {
	const navigate = useNavigate();
	const recordVitalsMutation = useRecordVitals();

	// Patient search state
	const [patientSearch, setPatientSearch] = useState("");
	const [showSearchResults, setShowSearchResults] = useState(false);
	const [selectedPatient, setSelectedPatient] = useState<{
		id: string;
		patientId: string;
		firstName: string;
		lastName: string;
	} | null>(null);

	// Search patients
	const { data: searchResults, isLoading: searchLoading } = useSearchPatients({
		q: patientSearch,
		limit: 10,
	});

	const form = useForm({
		defaultValues: {
			patientId: "",
			temperatureValue: "",
			temperatureUnit: "CELSIUS",
			systolic: "",
			diastolic: "",
			heartRate: "",
			respiratoryRate: "",
			oxygenSaturation: "",
			weightValue: "",
			weightUnit: "KG",
			heightValue: "",
			heightUnit: "CM",
			bloodGlucoseValue: "",
			bloodGlucoseUnit: "MG_DL",
			bloodGlucoseTiming: "RANDOM",
			painLevel: "",
			notes: "",
		},
		onSubmit: async ({ value }) => {
			// Validate at least one vital is provided
			const hasVital =
				value.temperatureValue ||
				(value.systolic && value.diastolic) ||
				value.heartRate ||
				value.respiratoryRate ||
				value.oxygenSaturation ||
				value.weightValue ||
				value.heightValue ||
				value.bloodGlucoseValue ||
				value.painLevel;

			if (!hasVital) {
				toast.error("At least one vital measurement is required");
				return;
			}

			try {
				// Build the vitals input
				const input: Parameters<typeof recordVitalsMutation.mutateAsync>[0] = {
					patientId: value.patientId,
				};

				// Temperature
				if (value.temperatureValue) {
					input.temperature = {
						value: Number.parseFloat(value.temperatureValue),
						unit: value.temperatureUnit as "CELSIUS" | "FAHRENHEIT",
					};
				}

				// Blood Pressure
				if (value.systolic && value.diastolic) {
					input.bloodPressure = {
						systolic: Number.parseInt(value.systolic, 10),
						diastolic: Number.parseInt(value.diastolic, 10),
					};
				}

				// Heart Rate
				if (value.heartRate) {
					input.heartRate = Number.parseInt(value.heartRate, 10);
				}

				// Respiratory Rate
				if (value.respiratoryRate) {
					input.respiratoryRate = Number.parseInt(value.respiratoryRate, 10);
				}

				// Oxygen Saturation
				if (value.oxygenSaturation) {
					input.oxygenSaturation = Number.parseInt(value.oxygenSaturation, 10);
				}

				// Weight
				if (value.weightValue) {
					input.weight = {
						value: Number.parseFloat(value.weightValue),
						unit: value.weightUnit as "KG" | "LB",
					};
				}

				// Height
				if (value.heightValue) {
					input.height = {
						value: Number.parseFloat(value.heightValue),
						unit: value.heightUnit as "CM" | "IN",
					};
				}

				// Blood Glucose
				if (value.bloodGlucoseValue) {
					input.bloodGlucose = {
						value: Number.parseFloat(value.bloodGlucoseValue),
						unit: value.bloodGlucoseUnit as "MG_DL" | "MMOL_L",
						timing: value.bloodGlucoseTiming as
							| "FASTING"
							| "RANDOM"
							| "POSTPRANDIAL",
					};
				}

				// Pain Level
				if (value.painLevel) {
					input.painLevel = Number.parseInt(value.painLevel, 10);
				}

				// Notes
				if (value.notes) {
					input.notes = value.notes;
				}

				const result = await recordVitalsMutation.mutateAsync(input);
				toast.success("Vitals recorded successfully");

				// Show alerts if any
				if (result.alerts && result.alerts.length > 0) {
					const criticalAlerts = result.alerts.filter(
						(a) => a.severity === "CRITICAL" || a.severity === "HIGH",
					);
					if (criticalAlerts.length > 0) {
						toast.warning(
							`${criticalAlerts.length} alert(s) detected! Check vitals details.`,
						);
					}
				}

				navigate({ to: "/dashboard/vitals/$id", params: { id: result.id } });
			} catch (error) {
				const apiError = error as ApiError;
				toast.error(apiError.message || "Failed to record vitals");
			}
		},
		validators: {
			onSubmit: recordVitalsSchema,
		},
	});

	const handlePatientSelect = (patient: {
		id: string;
		patientId: string;
		firstName: string;
		lastName: string;
	}) => {
		setSelectedPatient(patient);
		form.setFieldValue("patientId", patient.id);
		setShowSearchResults(false);
		setPatientSearch("");
	};

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" asChild>
					<Link to="/dashboard">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-2xl">Record Vitals</h1>
					<p className="text-muted-foreground">
						Enter vital signs for a patient
					</p>
				</div>
			</div>

			{/* Form */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="grid gap-6 lg:grid-cols-2"
			>
				{/* Patient Selection */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Patient Selection
						</CardTitle>
						<CardDescription>
							Search and select a patient to record vitals for
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form.Field name="patientId">
							{(field) => (
								<div className="space-y-2">
									<Label>Patient *</Label>
									{selectedPatient ? (
										<div className="flex items-center gap-2">
											<div className="flex-1 rounded-md border bg-muted p-3">
												<span className="font-medium">
													{selectedPatient.firstName} {selectedPatient.lastName}
												</span>
												<span className="ml-2 text-muted-foreground">
													({selectedPatient.patientId})
												</span>
											</div>
											<Button
												type="button"
												variant="outline"
												onClick={() => {
													setSelectedPatient(null);
													field.handleChange("");
												}}
											>
												Change
											</Button>
										</div>
									) : (
										<div className="relative">
											<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
											<Input
												placeholder="Search by name, ID, or phone..."
												value={patientSearch}
												onChange={(e) => {
													setPatientSearch(e.target.value);
													setShowSearchResults(true);
												}}
												onFocus={() => setShowSearchResults(true)}
												className="pl-9"
											/>
											{showSearchResults && patientSearch.length >= 2 && (
												<div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
													{searchLoading ? (
														<div className="p-4 text-center text-muted-foreground">
															<Loader2 className="mx-auto h-4 w-4 animate-spin" />
														</div>
													) : searchResults && searchResults.length > 0 ? (
														<ul className="max-h-60 overflow-auto py-1">
															{searchResults.map((patient) => (
																<li key={patient.id}>
																	<button
																		type="button"
																		className="w-full px-4 py-2 text-left hover:bg-muted"
																		onClick={() => handlePatientSelect(patient)}
																	>
																		<div className="font-medium">
																			{patient.firstName} {patient.lastName}
																		</div>
																		<div className="text-muted-foreground text-sm">
																			ID: {patient.patientId} | {patient.phone}
																		</div>
																	</button>
																</li>
															))}
														</ul>
													) : (
														<div className="p-4 text-center text-muted-foreground">
															No patients found
														</div>
													)}
												</div>
											)}
										</div>
									)}
									{field.state.meta.errors.map((error) => (
										<p key={String(error)} className="text-red-500 text-sm">
											{String(error)}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				{/* Core Vitals */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Core Vitals
						</CardTitle>
						<CardDescription>Primary vital sign measurements</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Temperature */}
						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field name="temperatureValue">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Temperature</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											step="0.1"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="98.6"
										/>
									</div>
								)}
							</form.Field>
							<form.Field name="temperatureUnit">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Unit</Label>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger id={field.name}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="CELSIUS">Celsius (°C)</SelectItem>
												<SelectItem value="FAHRENHEIT">
													Fahrenheit (°F)
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</form.Field>
						</div>

						{/* Blood Pressure */}
						<div className="space-y-2">
							<Label>Blood Pressure (mmHg)</Label>
							<div className="grid gap-4 sm:grid-cols-2">
								<form.Field name="systolic">
									{(field) => (
										<Input
											id={field.name}
											name={field.name}
											type="number"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Systolic (e.g., 120)"
										/>
									)}
								</form.Field>
								<form.Field name="diastolic">
									{(field) => (
										<Input
											id={field.name}
											name={field.name}
											type="number"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Diastolic (e.g., 80)"
										/>
									)}
								</form.Field>
							</div>
						</div>

						{/* Heart Rate */}
						<form.Field name="heartRate">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Heart Rate (bpm)</Label>
									<Input
										id={field.name}
										name={field.name}
										type="number"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="72"
									/>
								</div>
							)}
						</form.Field>

						{/* Respiratory Rate */}
						<form.Field name="respiratoryRate">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Respiratory Rate (per min)</Label>
									<Input
										id={field.name}
										name={field.name}
										type="number"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="16"
									/>
								</div>
							)}
						</form.Field>

						{/* Oxygen Saturation */}
						<form.Field name="oxygenSaturation">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Oxygen Saturation (%)</Label>
									<Input
										id={field.name}
										name={field.name}
										type="number"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="98"
									/>
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				{/* Additional Measurements */}
				<Card>
					<CardHeader>
						<CardTitle>Additional Measurements</CardTitle>
						<CardDescription>
							Weight, height, blood glucose, and pain assessment
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Weight */}
						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field name="weightValue">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Weight</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											step="0.1"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="70"
										/>
									</div>
								)}
							</form.Field>
							<form.Field name="weightUnit">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Unit</Label>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger id={field.name}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="KG">Kilograms (kg)</SelectItem>
												<SelectItem value="LB">Pounds (lb)</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</form.Field>
						</div>

						{/* Height */}
						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field name="heightValue">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Height</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											step="0.1"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="170"
										/>
									</div>
								)}
							</form.Field>
							<form.Field name="heightUnit">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Unit</Label>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger id={field.name}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="CM">Centimeters (cm)</SelectItem>
												<SelectItem value="IN">Inches (in)</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</form.Field>
						</div>

						{/* Blood Glucose */}
						<div className="space-y-2">
							<Label>Blood Glucose</Label>
							<div className="grid gap-4 sm:grid-cols-3">
								<form.Field name="bloodGlucoseValue">
									{(field) => (
										<Input
											id={field.name}
											name={field.name}
											type="number"
											step="0.1"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="100"
										/>
									)}
								</form.Field>
								<form.Field name="bloodGlucoseUnit">
									{(field) => (
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger id={field.name}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="MG_DL">mg/dL</SelectItem>
												<SelectItem value="MMOL_L">mmol/L</SelectItem>
											</SelectContent>
										</Select>
									)}
								</form.Field>
								<form.Field name="bloodGlucoseTiming">
									{(field) => (
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger id={field.name}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="FASTING">Fasting</SelectItem>
												<SelectItem value="RANDOM">Random</SelectItem>
												<SelectItem value="POSTPRANDIAL">
													Postprandial
												</SelectItem>
											</SelectContent>
										</Select>
									)}
								</form.Field>
							</div>
						</div>

						{/* Pain Level */}
						<form.Field name="painLevel">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Pain Level (0-10)</Label>
									<Input
										id={field.name}
										name={field.name}
										type="number"
										min="0"
										max="10"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="0 = No Pain, 10 = Severe Pain"
									/>
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				{/* Notes */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Notes</CardTitle>
						<CardDescription>
							Additional observations or comments
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form.Field name="notes">
							{(field) => (
								<div className="space-y-2">
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Enter any additional notes or observations..."
										rows={4}
									/>
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				{/* Validation Info */}
				<Card className="border-amber-200 bg-amber-50 lg:col-span-2 dark:border-amber-900 dark:bg-amber-950">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
							<AlertTriangle className="h-5 w-5" />
							Validation Ranges
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-2 text-amber-700 text-sm sm:grid-cols-2 lg:grid-cols-4 dark:text-amber-400">
							<div>
								<strong>Temperature:</strong> 25-45°C / 77-113°F
							</div>
							<div>
								<strong>Blood Pressure:</strong> 40-300 / 20-200 mmHg
							</div>
							<div>
								<strong>Heart Rate:</strong> 20-300 bpm
							</div>
							<div>
								<strong>Respiratory:</strong> 4-60 per min
							</div>
							<div>
								<strong>O2 Saturation:</strong> 50-100%
							</div>
							<div>
								<strong>Pain Level:</strong> 0-10
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Submit Button */}
				<div className="flex justify-end gap-4 lg:col-span-2">
					<Button type="button" variant="outline" asChild>
						<Link to="/dashboard">Cancel</Link>
					</Button>
					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								disabled={
									state.isSubmitting ||
									recordVitalsMutation.isPending ||
									!selectedPatient
								}
							>
								{state.isSubmitting || recordVitalsMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Recording...
									</>
								) : (
									<>
										<Activity className="mr-2 h-4 w-4" />
										Record Vitals
									</>
								)}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>
	);
}
