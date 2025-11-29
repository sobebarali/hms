import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterHospital } from "@/hooks/use-hospital";
import type { AuthError } from "@/lib/auth-client";

export const Route = createFileRoute("/register-hospital")({
	component: RegisterHospitalPage,
});

const registrationSchema = z.object({
	name: z.string().min(1, "Hospital name is required"),
	address: z.object({
		street: z.string().min(1, "Street address is required"),
		city: z.string().min(1, "City is required"),
		state: z.string().min(1, "State is required"),
		postalCode: z.string().min(1, "Postal code is required"),
		country: z.string().min(1, "Country is required"),
	}),
	contactEmail: z.string().email("Invalid contact email"),
	contactPhone: z.string().min(1, "Contact phone is required"),
	licenseNumber: z.string().min(1, "License number is required"),
	adminEmail: z.string().email("Invalid admin email"),
	adminPhone: z.string().min(1, "Admin phone is required"),
});

function RegisterHospitalPage() {
	const registerMutation = useRegisterHospital();
	const [registrationSuccess, setRegistrationSuccess] = useState(false);
	const [registeredEmail, setRegisteredEmail] = useState("");

	const form = useForm({
		defaultValues: {
			name: "",
			address: {
				street: "",
				city: "",
				state: "",
				postalCode: "",
				country: "",
			},
			contactEmail: "",
			contactPhone: "",
			licenseNumber: "",
			adminEmail: "",
			adminPhone: "",
		},
		onSubmit: async ({ value }) => {
			try {
				await registerMutation.mutateAsync(value);
				setRegisteredEmail(value.adminEmail);
				setRegistrationSuccess(true);
				toast.success("Hospital registered successfully!");
			} catch (error) {
				const authError = error as AuthError;
				toast.error(authError.message || "Registration failed");
			}
		},
		validators: {
			onSubmit: registrationSchema,
		},
	});

	if (registrationSuccess) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
							<CheckCircle2 className="h-8 w-8 text-green-600" />
						</div>
						<h1 className="font-bold text-2xl">Registration Successful!</h1>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-muted-foreground">
							We've sent a verification email to{" "}
							<span className="font-medium text-foreground">
								{registeredEmail}
							</span>
						</p>
						<p className="text-muted-foreground text-sm">
							Please check your inbox and click the verification link to
							activate your hospital account. The link will expire in 24 hours.
						</p>
						<div className="rounded-lg border bg-muted/50 p-4">
							<p className="font-medium text-sm">What happens next?</p>
							<ul className="mt-2 space-y-1 text-left text-muted-foreground text-sm">
								<li>1. Verify your email address</li>
								<li>2. Receive your admin login credentials</li>
								<li>3. Sign in to set up your hospital</li>
							</ul>
						</div>
						<Button asChild className="w-full">
							<Link to="/login">Go to Login</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-8">
			<div className="mx-auto max-w-2xl">
				{/* Header */}
				<div className="mb-8">
					<Button variant="ghost" size="sm" asChild className="mb-4">
						<Link to="/">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Home
						</Link>
					</Button>
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
							<Building2 className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h1 className="font-bold text-2xl">Register Your Hospital</h1>
							<p className="text-muted-foreground">
								Create your hospital account on the HMS platform
							</p>
						</div>
					</div>
				</div>

				{/* Registration Form */}
				<Card>
					<CardContent className="pt-6">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-6"
						>
							{/* Hospital Information */}
							<div className="space-y-4">
								<h2 className="font-semibold text-lg">Hospital Information</h2>

								<form.Field name="name">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>Hospital Name *</Label>
											<Input
												id={field.name}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												placeholder="City General Hospital"
											/>
											{field.state.meta.errors.map((error) => (
												<p
													key={error?.message}
													className="text-red-500 text-sm"
												>
													{error?.message}
												</p>
											))}
										</div>
									)}
								</form.Field>

								<form.Field name="licenseNumber">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>License Number *</Label>
											<Input
												id={field.name}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												placeholder="MED-2024-001234"
											/>
											<p className="text-muted-foreground text-xs">
												Your official hospital license number
											</p>
											{field.state.meta.errors.map((error) => (
												<p
													key={error?.message}
													className="text-red-500 text-sm"
												>
													{error?.message}
												</p>
											))}
										</div>
									)}
								</form.Field>

								<div className="grid gap-4 sm:grid-cols-2">
									<form.Field name="contactEmail">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Contact Email *</Label>
												<Input
													id={field.name}
													type="email"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder="info@hospital.com"
												/>
												{field.state.meta.errors.map((error) => (
													<p
														key={error?.message}
														className="text-red-500 text-sm"
													>
														{error?.message}
													</p>
												))}
											</div>
										)}
									</form.Field>

									<form.Field name="contactPhone">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Contact Phone *</Label>
												<Input
													id={field.name}
													type="tel"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder="+1-555-0100"
												/>
												{field.state.meta.errors.map((error) => (
													<p
														key={error?.message}
														className="text-red-500 text-sm"
													>
														{error?.message}
													</p>
												))}
											</div>
										)}
									</form.Field>
								</div>
							</div>

							{/* Address */}
							<div className="space-y-4">
								<h2 className="font-semibold text-lg">Address</h2>

								<form.Field name="address.street">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>Street Address *</Label>
											<Input
												id={field.name}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												placeholder="123 Main Street"
											/>
											{field.state.meta.errors.map((error) => (
												<p
													key={error?.message}
													className="text-red-500 text-sm"
												>
													{error?.message}
												</p>
											))}
										</div>
									)}
								</form.Field>

								<div className="grid gap-4 sm:grid-cols-2">
									<form.Field name="address.city">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>City *</Label>
												<Input
													id={field.name}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder="New York"
												/>
												{field.state.meta.errors.map((error) => (
													<p
														key={error?.message}
														className="text-red-500 text-sm"
													>
														{error?.message}
													</p>
												))}
											</div>
										)}
									</form.Field>

									<form.Field name="address.state">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>State/Province *</Label>
												<Input
													id={field.name}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder="NY"
												/>
												{field.state.meta.errors.map((error) => (
													<p
														key={error?.message}
														className="text-red-500 text-sm"
													>
														{error?.message}
													</p>
												))}
											</div>
										)}
									</form.Field>
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<form.Field name="address.postalCode">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Postal Code *</Label>
												<Input
													id={field.name}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder="10001"
												/>
												{field.state.meta.errors.map((error) => (
													<p
														key={error?.message}
														className="text-red-500 text-sm"
													>
														{error?.message}
													</p>
												))}
											</div>
										)}
									</form.Field>

									<form.Field name="address.country">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Country *</Label>
												<Input
													id={field.name}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder="USA"
												/>
												{field.state.meta.errors.map((error) => (
													<p
														key={error?.message}
														className="text-red-500 text-sm"
													>
														{error?.message}
													</p>
												))}
											</div>
										)}
									</form.Field>
								</div>
							</div>

							{/* Admin Account */}
							<div className="space-y-4">
								<h2 className="font-semibold text-lg">Administrator Account</h2>
								<p className="text-muted-foreground text-sm">
									This will be the primary administrator for your hospital
								</p>

								<div className="grid gap-4 sm:grid-cols-2">
									<form.Field name="adminEmail">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Admin Email *</Label>
												<Input
													id={field.name}
													type="email"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder="admin@hospital.com"
												/>
												<p className="text-muted-foreground text-xs">
													Verification link will be sent here
												</p>
												{field.state.meta.errors.map((error) => (
													<p
														key={error?.message}
														className="text-red-500 text-sm"
													>
														{error?.message}
													</p>
												))}
											</div>
										)}
									</form.Field>

									<form.Field name="adminPhone">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Admin Phone *</Label>
												<Input
													id={field.name}
													type="tel"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder="+1-555-0101"
												/>
												{field.state.meta.errors.map((error) => (
													<p
														key={error?.message}
														className="text-red-500 text-sm"
													>
														{error?.message}
													</p>
												))}
											</div>
										)}
									</form.Field>
								</div>
							</div>

							{/* Submit */}
							<div className="border-t pt-6">
								<form.Subscribe>
									{(state) => (
										<Button
											type="submit"
											className="w-full"
											size="lg"
											disabled={
												!state.canSubmit ||
												state.isSubmitting ||
												registerMutation.isPending
											}
										>
											{state.isSubmitting || registerMutation.isPending
												? "Registering..."
												: "Register Hospital"}
										</Button>
									)}
								</form.Subscribe>

								<p className="mt-4 text-center text-muted-foreground text-sm">
									Already have an account?{" "}
									<Link
										to="/login"
										className="text-primary underline-offset-4 hover:underline"
									>
										Sign in
									</Link>
								</p>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
