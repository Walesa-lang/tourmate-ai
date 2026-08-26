"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/utils/supabase/admin";
import { initialReviewState, validateReview, type ReviewState } from "./review";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function reviewApplication(previousState: ReviewState = initialReviewState, formData: FormData): Promise<ReviewState> {
  void previousState;
  const applicationId = String(formData.get("application_id") ?? "");
  if (!uuidPattern.test(applicationId)) return { type: "error", message: "Invalid application identifier." };

  const validation = validateReview(
    String(formData.get("decision") ?? ""),
    String(formData.get("rejection_reason") ?? ""),
    String(formData.get("internal_admin_note") ?? ""),
  );
  if (!validation.ok) return { type: "error", message: validation.error };

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("review_business_application", {
    p_application_id: applicationId,
    p_decision: validation.decision,
    p_rejection_reason: validation.rejectionReason,
    p_internal_admin_note: validation.internalNote,
  });

  if (error?.code === "23514" && /missing|no longer pending/i.test(error.message)) return { type: "error", message: "This application is no longer pending. No duplicate decision was recorded." };
  if (error) return { type: "error", message: "The application could not be reviewed. Please refresh and try again." };
  const result = data[0];
  if (!result) return { type: "error", message: "This application is no longer pending. No duplicate decision was recorded." };

  revalidatePath("/admin");
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/partner/dashboard");
  return { type: "success", message: `Application ${result.application_status} successfully.` };
}

export async function signOutAdmin() {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Unable to sign out securely.");
  redirect("/sign-in?redirectTo=%2Fadmin");
}
