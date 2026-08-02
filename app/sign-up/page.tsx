import type { Metadata } from "next";
import { AuthForm } from "../auth/auth-form";
import { AuthShell } from "../auth/auth-shell";

export const metadata: Metadata = { title: "Create Account | TourMate AI", description: "Create your TourMate AI account." };

export default function SignUpPage() {
  return <AuthShell eyebrow="Start exploring" title="Create your account" description="Join TourMate AI and turn your next travel idea into an unforgettable journey."><AuthForm mode="sign-up" /></AuthShell>;
}
