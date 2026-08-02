"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type AuthFormProps = { mode: "sign-in" | "sign-up" };
type FormStatus = { type: "error" | "success"; message: string } | null;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<FormStatus>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (isSignUp && password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match. Please try again." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;

        if (data.session) {
          setStatus({ type: "success", message: "Your account is ready. Taking you home…" });
          router.refresh();
          window.setTimeout(() => router.push("/"), 900);
        } else {
          setStatus({
            type: "success",
            message: "Account created. Check your email to confirm your address, then sign in.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus({ type: "success", message: "Signed in successfully. Taking you home…" });
        router.refresh();
        window.setTimeout(() => router.push("/"), 900);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {isSignUp && (
        <div className="auth-field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Your full name" required disabled={loading} />
        </div>
      )}
      <div className="auth-field">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required disabled={loading} />
      </div>
      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} placeholder={isSignUp ? "Create a password" : "Enter your password"} minLength={6} required disabled={loading} />
        {isSignUp && <small>Use at least 6 characters.</small>}
      </div>
      {isSignUp && (
        <div className="auth-field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Enter your password again" minLength={6} required disabled={loading} />
        </div>
      )}

      {status && <div className={`auth-message auth-message-${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.message}</div>}

      <button className="button auth-submit" type="submit" disabled={loading} aria-busy={loading}>
        {loading && <span className="auth-spinner" aria-hidden="true" />}
        {loading ? (isSignUp ? "Creating account…" : "Signing in…") : (isSignUp ? "Create account" : "Sign in")}
      </button>

      <p className="auth-switch">
        {isSignUp ? "Already have an account?" : "New to TourMate AI?"}{" "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</Link>
      </p>
    </form>
  );
}
