import type { Business } from "@/app/partner/business";

export const adminFilters = ["all", "pending", "approved", "rejected"] as const;
export type AdminFilter = (typeof adminFilters)[number];
export type ReviewDecision = Extract<Business["status"], "approved" | "rejected">;
export type ReviewState = { type: "idle" | "error" | "success"; message: string };
export type ReviewValidation = { ok: false; error: string } | { ok: true; decision: ReviewDecision; rejectionReason: string | null; internalNote: string | null };

export const initialReviewState: ReviewState = { type: "idle", message: "" };

export function parseAdminFilter(value: string | undefined): AdminFilter {
  return adminFilters.includes(value as AdminFilter) ? value as AdminFilter : "pending";
}

export function validateReview(decision: string, rejectionReason: string, internalNote: string): ReviewValidation {
  if (decision !== "approved" && decision !== "rejected") return { ok: false, error: "Choose approve or reject." };
  const reason = rejectionReason.trim();
  const note = internalNote.trim();
  if (decision === "rejected" && !reason) return { ok: false, error: "Enter a rejection reason before rejecting this application." };
  if (reason.length > 2000) return { ok: false, error: "The rejection reason must be 2,000 characters or fewer." };
  if (note.length > 4000) return { ok: false, error: "The internal note must be 4,000 characters or fewer." };
  return { ok: true, decision, rejectionReason: decision === "rejected" ? reason : null, internalNote: note || null };
}
