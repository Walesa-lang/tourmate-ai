"use client";

import { useActionState } from "react";
import { reviewApplication } from "./actions";
import { initialReviewState } from "./review";

export function ReviewForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(reviewApplication, initialReviewState);
  return <form className="admin-review-form" action={action} aria-labelledby="review-form-title">
    <input type="hidden" name="application_id" value={applicationId} />
    <div className="admin-section-heading"><p>Decision</p><h2 id="review-form-title">Review this application</h2></div>
    <div className="admin-field"><label htmlFor="rejection_reason">Rejection reason <span>(required when rejecting)</span></label><textarea id="rejection_reason" name="rejection_reason" rows={5} maxLength={2000} disabled={pending} aria-describedby="rejection-help" /><small id="rejection-help">This reason is shown to the applicant so they can understand what to correct.</small></div>
    <div className="admin-field"><label htmlFor="internal_admin_note">Internal admin note <span>(optional)</span></label><textarea id="internal_admin_note" name="internal_admin_note" rows={4} maxLength={4000} disabled={pending} /><small>Only administrators can read this note.</small></div>
    {state.message && <p className={`admin-feedback admin-feedback-${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</p>}
    <div className="admin-review-actions"><button className="button admin-approve" type="submit" name="decision" value="approved" disabled={pending} aria-busy={pending}>{pending ? "Saving decision…" : "Approve application"}</button><button className="button admin-reject" type="submit" name="decision" value="rejected" disabled={pending}>Reject application</button></div>
  </form>;
}
