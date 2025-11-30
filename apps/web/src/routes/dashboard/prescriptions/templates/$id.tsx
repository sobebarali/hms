import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft, BookTemplate, Loader2, Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useTemplate } from "@/hooks/use-prescriptions";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/prescriptions/templates/$id")({
	component: TemplateDetailPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function TemplateDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();

	const { data: template, isLoading, error } = useTemplate(id);

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !template) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 p-8">
				<BookTemplate className="h-12 w-12 text-muted-foreground" />
				<p className="text-muted-foreground">Template not found</p>
				<Button
					variant="outline"
					onClick={() => navigate({ to: "/dashboard/prescriptions/templates" })}
				>
					Back to Templates
				</Button>
			</div>
		);
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

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() =>
							navigate({ to: "/dashboard/prescriptions/templates" })
						}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="font-bold text-2xl">{template.name}</h1>
						<div className="flex items-center gap-2 text-muted-foreground">
							<Badge variant={template.isSystem ? "default" : "outline"}>
								{template.isSystem ? "System Template" : "Custom Template"}
							</Badge>
							{template.category && (
								<Badge variant="secondary">{template.category}</Badge>
							)}
						</div>
					</div>
				</div>
				<Button asChild>
					<Link
						to="/dashboard/prescriptions/create"
						search={{ templateId: template.id }}
					>
						<Pill className="mr-2 h-4 w-4" />
						Use Template
					</Link>
				</Button>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Template Details */}
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>Template Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="font-medium text-muted-foreground text-sm">Name</p>
							<p>{template.name}</p>
						</div>
						{template.category && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Category
								</p>
								<p>{template.category}</p>
							</div>
						)}
						{template.condition && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Condition
								</p>
								<p>{template.condition}</p>
							</div>
						)}
						{template.createdBy && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Created By
								</p>
								<p>
									Dr. {template.createdBy.firstName}{" "}
									{template.createdBy.lastName}
								</p>
							</div>
						)}
						<div>
							<p className="font-medium text-muted-foreground text-sm">
								Created At
							</p>
							<p>{formatDate(template.createdAt)}</p>
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-sm">
								Last Updated
							</p>
							<p>{formatDate(template.updatedAt)}</p>
						</div>
					</CardContent>
				</Card>

				{/* Medicines */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Medicines</CardTitle>
						<CardDescription>
							{template.medicines.length} medicine
							{template.medicines.length !== 1 ? "s" : ""} in this template
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Medicine</TableHead>
										<TableHead>Dosage</TableHead>
										<TableHead>Frequency</TableHead>
										<TableHead>Duration</TableHead>
										<TableHead>Route</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{template.medicines.map((medicine) => (
										<TableRow key={medicine.id}>
											<TableCell>
												<div>
													<p className="font-medium">{medicine.name}</p>
													{medicine.instructions && (
														<p className="text-muted-foreground text-sm">
															{medicine.instructions}
														</p>
													)}
												</div>
											</TableCell>
											<TableCell>
												{medicine.dosage || (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
											<TableCell>
												{medicine.frequency || (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
											<TableCell>
												{medicine.duration || (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
											<TableCell>
												{medicine.route || (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
