import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateTemplate } from "@/hooks/use-prescriptions";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute(
	"/dashboard/prescriptions/templates/create",
)({
	component: CreateTemplatePage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

interface TemplateMedicineForm {
	_id: string;
	name: string;
	dosage: string;
	frequency: string;
	duration: string;
	route: string;
	instructions: string;
}

function CreateTemplatePage() {
	const navigate = useNavigate();
	const createTemplateMutation = useCreateTemplate();

	const [name, setName] = useState("");
	const [category, setCategory] = useState("");
	const [condition, setCondition] = useState("");
	const [medicines, setMedicines] = useState<TemplateMedicineForm[]>([
		{
			_id: crypto.randomUUID(),
			name: "",
			dosage: "",
			frequency: "",
			duration: "",
			route: "",
			instructions: "",
		},
	]);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const addMedicine = () => {
		setMedicines([
			...medicines,
			{
				_id: crypto.randomUUID(),
				name: "",
				dosage: "",
				frequency: "",
				duration: "",
				route: "",
				instructions: "",
			},
		]);
	};

	const removeMedicine = (id: string) => {
		if (medicines.length > 1) {
			setMedicines(medicines.filter((m) => m._id !== id));
		}
	};

	const updateMedicine = (
		id: string,
		field: keyof TemplateMedicineForm,
		value: string,
	) => {
		setMedicines(
			medicines.map((m) => (m._id === id ? { ...m, [field]: value } : m)),
		);
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!name.trim()) {
			newErrors.name = "Template name is required";
		}

		let hasMedicineError = false;
		for (let i = 0; i < medicines.length; i++) {
			const med = medicines[i];
			if (!med.name.trim()) {
				newErrors[`medicine_${i}_name`] = "Medicine name is required";
				hasMedicineError = true;
			}
		}

		if (hasMedicineError) {
			newErrors.medicines = "At least one medicine must have a name";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		const medicineData = medicines
			.filter((m) => m.name.trim())
			.map((m) => ({
				name: m.name,
				dosage: m.dosage || undefined,
				frequency: m.frequency || undefined,
				duration: m.duration || undefined,
				route: m.route || undefined,
				instructions: m.instructions || undefined,
			}));

		try {
			await createTemplateMutation.mutateAsync({
				name,
				category: category || undefined,
				condition: condition || undefined,
				medicines: medicineData,
			});

			navigate({ to: "/dashboard/prescriptions/templates" });
		} catch (error) {
			console.error("Failed to create template:", error);
		}
	};

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate({ to: "/dashboard/prescriptions/templates" })}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-2xl">Create Template</h1>
					<p className="text-muted-foreground">
						Create a reusable prescription template
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
				{/* Template Info */}
				<Card>
					<CardHeader>
						<CardTitle>Template Information</CardTitle>
						<CardDescription>
							Basic details about this prescription template
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">
									Template Name <span className="text-destructive">*</span>
								</Label>
								<Input
									id="name"
									placeholder="e.g., Common Cold Treatment"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
								{errors.name && (
									<p className="text-destructive text-sm">{errors.name}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="category">Category</Label>
								<Input
									id="category"
									placeholder="e.g., Respiratory, Cardiology"
									value={category}
									onChange={(e) => setCategory(e.target.value)}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="condition">Condition / Diagnosis</Label>
							<Textarea
								id="condition"
								placeholder="Describe the condition this template is designed for..."
								value={condition}
								onChange={(e) => setCondition(e.target.value)}
								rows={2}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Medicines */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Medicines</CardTitle>
							<CardDescription>
								Add medicines to include in this template
							</CardDescription>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addMedicine}
						>
							<Plus className="mr-2 h-4 w-4" />
							Add Medicine
						</Button>
					</CardHeader>
					<CardContent className="space-y-4">
						{errors.medicines && (
							<p className="text-destructive text-sm">{errors.medicines}</p>
						)}

						{medicines.map((medicine, index) => (
							<div
								key={medicine._id}
								className="space-y-4 rounded-lg border p-4"
							>
								<div className="flex items-center justify-between">
									<span className="font-medium text-sm">
										Medicine {index + 1}
									</span>
									{medicines.length > 1 && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => removeMedicine(medicine._id)}
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									)}
								</div>

								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									<div className="space-y-2">
										<Label htmlFor={`medicine-name-${index}`}>
											Name <span className="text-destructive">*</span>
										</Label>
										<Input
											id={`medicine-name-${index}`}
											placeholder="Medicine name"
											value={medicine.name}
											onChange={(e) =>
												updateMedicine(medicine._id, "name", e.target.value)
											}
										/>
										{errors[`medicine_${index}_name`] && (
											<p className="text-destructive text-sm">
												{errors[`medicine_${index}_name`]}
											</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor={`medicine-dosage-${index}`}>Dosage</Label>
										<Input
											id={`medicine-dosage-${index}`}
											placeholder="e.g., 500mg"
											value={medicine.dosage}
											onChange={(e) =>
												updateMedicine(medicine._id, "dosage", e.target.value)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={`medicine-frequency-${index}`}>
											Frequency
										</Label>
										<Input
											id={`medicine-frequency-${index}`}
											placeholder="e.g., Twice daily"
											value={medicine.frequency}
											onChange={(e) =>
												updateMedicine(
													medicine._id,
													"frequency",
													e.target.value,
												)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={`medicine-duration-${index}`}>
											Duration
										</Label>
										<Input
											id={`medicine-duration-${index}`}
											placeholder="e.g., 7 days"
											value={medicine.duration}
											onChange={(e) =>
												updateMedicine(medicine._id, "duration", e.target.value)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={`medicine-route-${index}`}>Route</Label>
										<Input
											id={`medicine-route-${index}`}
											placeholder="e.g., Oral"
											value={medicine.route}
											onChange={(e) =>
												updateMedicine(medicine._id, "route", e.target.value)
											}
										/>
									</div>
									<div className="space-y-2 sm:col-span-2 lg:col-span-1">
										<Label htmlFor={`medicine-instructions-${index}`}>
											Instructions
										</Label>
										<Input
											id={`medicine-instructions-${index}`}
											placeholder="e.g., Take after meals"
											value={medicine.instructions}
											onChange={(e) =>
												updateMedicine(
													medicine._id,
													"instructions",
													e.target.value,
												)
											}
										/>
									</div>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				{/* Actions */}
				<div className="flex gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() =>
							navigate({ to: "/dashboard/prescriptions/templates" })
						}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={createTemplateMutation.isPending}>
						{createTemplateMutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Create Template
					</Button>
				</div>

				{createTemplateMutation.isError && (
					<p className="text-destructive text-sm">
						Failed to create template. Please try again.
					</p>
				)}
			</form>
		</div>
	);
}
