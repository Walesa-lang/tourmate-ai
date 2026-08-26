import type { Metadata } from "next";
import { AuthForm } from "../auth/auth-form";
import { AuthShell } from "../auth/auth-shell";

export const metadata: Metadata = { title: "Sign In | TourMate AI", description: "Sign in to your TourMate AI account." };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ redirectTo?: string }> }) {
  const { redirectTo } = await searchParams;
  const safeRedirect = ["/dashboard", "/trip-planner", "/hotels", "/attractions", "/partner/apply", "/partner/dashboard", "/admin"].includes(redirectTo ?? "")
    ? redirectTo!
    : "/";
  return <AuthShell eyebrow="Welcome back" title="Sign in to TourMate AI" description="Continue planning memorable journeys with your personal AI travel companion."><AuthForm mode="sign-in" redirectTo={safeRedirect} /></AuthShell>;
}
