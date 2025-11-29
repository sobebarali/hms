import { Link } from "@tanstack/react-router";
import { Building2, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	return (
		<div className="w-full">
			<div className="mb-8 text-center lg:text-left">
				<h1 className="font-bold text-2xl">Create Account</h1>
				<p className="mt-2 text-muted-foreground">
					Choose how you'd like to get started
				</p>
			</div>

			<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
				<CardContent className="space-y-4 pt-6">
					<div className="rounded-lg border border-border/50 bg-background/50 p-4 transition-colors hover:bg-background/80">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-primary/10 p-2">
								<Building2 className="h-5 w-5 text-primary" />
							</div>
							<div className="flex-1">
								<h3 className="font-medium">Register a New Hospital</h3>
								<p className="mt-1 text-muted-foreground text-sm">
									If you're setting up a new hospital, register your
									organization and you'll be created as the hospital admin.
								</p>
								<Button className="mt-3 w-full" asChild>
									<Link to="/register-hospital">Register Hospital</Link>
								</Button>
							</div>
						</div>
					</div>

					<div className="rounded-lg border border-border/50 bg-background/50 p-4">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-muted p-2">
								<UserPlus className="h-5 w-5 text-muted-foreground" />
							</div>
							<div className="flex-1">
								<h3 className="font-medium">Contact Your Administrator</h3>
								<p className="mt-1 text-muted-foreground text-sm">
									If your hospital is already registered, ask your hospital
									administrator to create an account for you.
								</p>
							</div>
						</div>
					</div>

					<div className="pt-2 text-center">
						<Button
							variant="link"
							onClick={onSwitchToSignIn}
							className="text-primary"
						>
							Already have an account? Sign In
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
