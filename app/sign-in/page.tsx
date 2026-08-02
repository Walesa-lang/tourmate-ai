import type { Metadata } from "next";
import { AuthForm } from "../auth/auth-form";
import { AuthShell } from "../auth/auth-shell";

export const metadata: Metadata = { title: "Sign In | TourMate AI", description: "Sign in to your TourMate AI account." };

export default function SignInPage() {
  return <AuthShell eyebrow="Welcome back" title="Sign in to TourMate AI" description="Continue planning memorable journeys with your personal AI travel companion."><AuthForm mode="sign-in" /></AuthShell>;
}
