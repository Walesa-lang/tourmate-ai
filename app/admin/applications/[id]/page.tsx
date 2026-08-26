import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/utils/supabase/admin";
import { businessTypeLabel } from "@/app/partner/business";
import { AdminHeader } from "../../admin-header";
import { ReviewForm } from "../../review-form";

export const metadata: Metadata = { title: "Review Partner Application | TourMate AI Admin" };

export default async function AdminApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAdmin();
  const { id } = await params;
  const { data: application, error } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load this partner application.");
  if (!application) notFound();
  const { data: review, error: reviewError } = application.status === "pending"
    ? { data: null, error: null }
    : await supabase.from("business_application_reviews").select("*").eq("application_id", id).maybeSingle();
  if (reviewError) throw new Error("Unable to load this application review.");

  const details = [
    ["Applicant name", application.contact_name], ["Business name", application.business_name], ["Business type", businessTypeLabel(application.business_type)],
    ["Business email", application.contact_email], ["Phone", application.phone], ["Location", `${application.city}, ${application.country}`],
    ["Website", application.website_url], ["Submitted", new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(new Date(application.created_at))],
  ] as const;

  return <div className="site-shell admin-page"><AdminHeader email={user.email} /><main className="admin-main"><div className="container admin-detail-wrap"><Link className="admin-back" href="/admin">← Back to applications</Link><section className="admin-detail-card"><div className="admin-detail-title"><div><p>Partner application</p><h1>{application.business_name}</h1></div><span className={`partner-status partner-status-${application.status}`}>{application.status}</span></div><dl className="admin-detail-grid">{details.map(([label, value]) => value && <div key={label}><dt>{label}</dt><dd>{label === "Website" ? <a href={value} target="_blank" rel="noreferrer">{value}</a> : value}</dd></div>)}</dl><div className="admin-description"><h2>Business description</h2><p>{application.description}</p></div></section>
    {application.status === "pending" ? <ReviewForm applicationId={application.id} /> : <section className="admin-review-summary"><div className="admin-section-heading"><p>Decision recorded</p><h2>Application {application.status}</h2></div><dl><div><dt>Reviewed</dt><dd>{application.reviewed_at ? <time dateTime={application.reviewed_at}>{new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(new Date(application.reviewed_at))}</time> : "Legacy decision"}</dd></div>{application.rejection_reason && <div><dt>Rejection reason</dt><dd>{application.rejection_reason}</dd></div>}{review?.internal_admin_note && <div><dt>Internal note</dt><dd>{review.internal_admin_note}</dd></div>}</dl></section>}
  </div></main></div>;
}
