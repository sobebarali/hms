import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	Activity,
	Clock,
	FileText,
	History,
	PlusCircle,
	TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/vitals/")({
	component: VitalsIndexPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function VitalsIndexPage() {
	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Vitals Management</h1>
					<p className="text-muted-foreground">
						Record, view, and analyze patient vital signs
					</p>
				</div>
				<Button asChild>
					<Link to="/dashboard/vitals/record">
						<PlusCircle className="mr-2 h-4 w-4" />
						Record New Vitals
					</Link>
				</Button>
			</div>

			{/* Quick Actions Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{/* Record Vitals */}
				<Card className="transition-colors hover:border-primary">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5 text-primary" />
							Record Vitals
						</CardTitle>
						<CardDescription>
							Enter new vital sign measurements for a patient
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-muted-foreground text-sm">
							Record temperature, blood pressure, heart rate, respiratory rate,
							oxygen saturation, weight, height, blood glucose, and pain level.
						</p>
						<Button asChild className="w-full">
							<Link to="/dashboard/vitals/record">
								<PlusCircle className="mr-2 h-4 w-4" />
								Record New
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Vitals History */}
				<Card className="transition-colors hover:border-primary">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<History className="h-5 w-5 text-primary" />
							Vitals History
						</CardTitle>
						<CardDescription>
							View and filter patient vitals records over time
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-muted-foreground text-sm">
							Search for a patient, view their complete vitals history, filter
							by date range, and analyze specific parameters.
						</p>
						<Button variant="outline" asChild className="w-full">
							<Link to="/dashboard/vitals/history">
								<Clock className="mr-2 h-4 w-4" />
								View History
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Trends Analysis */}
				<Card className="transition-colors hover:border-primary">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-primary" />
							Trends & Analysis
						</CardTitle>
						<CardDescription>
							Analyze vital sign trends and statistics
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-muted-foreground text-sm">
							View trends for individual vital parameters, including min, max,
							and average values over selected time periods.
						</p>
						<Button variant="outline" asChild className="w-full">
							<Link to="/dashboard/vitals/history">
								<TrendingUp className="mr-2 h-4 w-4" />
								View Trends
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Information Cards */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Vital Parameters Info */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Supported Vital Parameters
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-lg border p-3">
								<div className="font-medium">Temperature</div>
								<div className="text-muted-foreground text-sm">
									25-45°C / 77-113°F
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Blood Pressure</div>
								<div className="text-muted-foreground text-sm">
									Systolic 40-300 / Diastolic 20-200 mmHg
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Heart Rate</div>
								<div className="text-muted-foreground text-sm">20-300 bpm</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Respiratory Rate</div>
								<div className="text-muted-foreground text-sm">
									4-60 per minute
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Oxygen Saturation</div>
								<div className="text-muted-foreground text-sm">50-100%</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Pain Level</div>
								<div className="text-muted-foreground text-sm">0-10 scale</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Weight & Height</div>
								<div className="text-muted-foreground text-sm">
									Auto-calculates BMI
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Blood Glucose</div>
								<div className="text-muted-foreground text-sm">
									Fasting, Random, Postprandial
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Alert System Info */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Automatic Alert System
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground text-sm">
							The system automatically generates alerts when vital signs fall
							outside normal ranges. Alerts are categorized by severity:
						</p>
						<div className="space-y-2">
							<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-950">
								<div className="h-3 w-3 rounded-full bg-red-500" />
								<span className="font-medium text-red-700 dark:text-red-400">
									Critical
								</span>
								<span className="text-red-600 text-sm dark:text-red-400">
									- Requires immediate attention
								</span>
							</div>
							<div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2 dark:border-orange-900 dark:bg-orange-950">
								<div className="h-3 w-3 rounded-full bg-orange-500" />
								<span className="font-medium text-orange-700 dark:text-orange-400">
									High
								</span>
								<span className="text-orange-600 text-sm dark:text-orange-400">
									- Significant abnormality
								</span>
							</div>
							<div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-2 dark:border-yellow-900 dark:bg-yellow-950">
								<div className="h-3 w-3 rounded-full bg-yellow-500" />
								<span className="font-medium text-yellow-700 dark:text-yellow-400">
									Medium
								</span>
								<span className="text-sm text-yellow-600 dark:text-yellow-400">
									- Moderate deviation
								</span>
							</div>
							<div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-900 dark:bg-blue-950">
								<div className="h-3 w-3 rounded-full bg-blue-500" />
								<span className="font-medium text-blue-700 dark:text-blue-400">
									Low
								</span>
								<span className="text-blue-600 text-sm dark:text-blue-400">
									- Minor variation
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
