import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useVerifyHospital } from "@/hooks/use-hospital";
import type { AuthError } from "@/lib/auth-client";

export const Route = createFileRoute("/verify-hospital")({
	component: VerifyHospitalPage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			token: (search.token as string) || "",
			hospitalId: (search.hospitalId as string) || "",
		};
	},
});

function VerifyHospitalPage() {
	const { token, hospitalId } = Route.useSearch();
	const verifyMutation = useVerifyHospital();
	const [verificationAttempted, setVerificationAttempted] = useState(false);

	useEffect(() => {
		if (token && hospitalId && !verificationAttempted) {
			setVerificationAttempted(true);
			verifyMutation.mutate({ hospitalId, token });
		}
	}, [token, hospitalId, verificationAttempted, verifyMutation]);

	// Missing parameters
	if (!token || !hospitalId) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
							<AlertCircle className="h-8 w-8 text-red-600" />
						</div>
						<h1 className="font-bold text-2xl">Invalid Verification Link</h1>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-muted-foreground">
							The verification link is missing required parameters. Please check
							your email and try clicking the link again.
						</p>
						<Button asChild className="w-full">
							<Link to="/">Go to Home</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Loading state
	if (verifyMutation.isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
						</div>
						<h1 className="font-bold text-2xl">Verifying Your Hospital</h1>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-muted-foreground">
							Please wait while we verify your hospital account...
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Error state
	if (verifyMutation.isError) {
		const error = verifyMutation.error as unknown as AuthError;
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
							<AlertCircle className="h-8 w-8 text-red-600" />
						</div>
						<h1 className="font-bold text-2xl">Verification Failed</h1>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-muted-foreground">
							{error?.message || "Failed to verify your hospital account."}
						</p>
						{error?.code === "TOKEN_EXPIRED" && (
							<p className="text-muted-foreground text-sm">
								Your verification link has expired. Please contact support or
								register again.
							</p>
						)}
						{error?.code === "ALREADY_VERIFIED" && (
							<p className="text-muted-foreground text-sm">
								Your hospital has already been verified. You can proceed to sign
								in.
							</p>
						)}
						<div className="flex flex-col gap-2">
							{error?.code === "ALREADY_VERIFIED" ? (
								<Button asChild className="w-full">
									<Link to="/login">Go to Login</Link>
								</Button>
							) : (
								<>
									<Button asChild className="w-full">
										<Link to="/register-hospital">Register Again</Link>
									</Button>
									<Button variant="outline" asChild className="w-full">
										<Link to="/">Go to Home</Link>
									</Button>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Success state
	if (verifyMutation.isSuccess) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
							<CheckCircle2 className="h-8 w-8 text-green-600" />
						</div>
						<h1 className="font-bold text-2xl">Hospital Verified!</h1>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-muted-foreground">
							Your hospital has been successfully verified and activated.
						</p>
						<div className="rounded-lg border bg-muted/50 p-4">
							<p className="font-medium text-sm">What happens next?</p>
							<ul className="mt-2 space-y-1 text-left text-muted-foreground text-sm">
								<li>1. Check your email for login credentials</li>
								<li>2. Sign in with your admin account</li>
								<li>3. You'll be prompted to change your password</li>
								<li>4. Start setting up your hospital!</li>
							</ul>
						</div>
						<Button asChild className="w-full" size="lg">
							<Link to="/login">Proceed to Login</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Default/idle state (waiting for effect to run)
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
					<h1 className="font-bold text-2xl">Preparing Verification</h1>
				</CardHeader>
				<CardContent className="text-center">
					<p className="text-muted-foreground">
						Please wait while we prepare to verify your hospital...
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
