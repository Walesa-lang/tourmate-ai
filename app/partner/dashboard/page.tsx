import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SiteNavigation } from "@/app/components/site-navigation";
import { businessTypeLabel } from "../business";

export const metadata: Metadata = { title: "Partner Dashboard | TourMate AI", description: "View your TourMate AI partner application." };

export default async function PartnerDashboardPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user && (!authError || authError.name === "AuthSessionMissingError")) redirect("/sign-in?redirectTo=%2Fpartner%2Fdashboard");
  if (authError || !user) throw new Error("Unable to verify the authenticated user.");
  const { data: business, error } = await supabase.from("businesses").select("*").eq("owner_id", user.id).maybeSingle();
  if (error) throw new Error("Unable to load your partner application.");
  const { success } = await searchParams;
  const submitted = success === "submitted" || success === "updated";

  return <div className="site-shell partner-page"><SiteNavigation headerClassName="dashboard-header" /><main className="partner-main">
    <section className="partner-hero partner-dashboard-hero"><div className="container"><p className="partner-eyebrow">Your partner space</p><h1>Business partner dashboard</h1><p>Track your application and understand what happens next.</p></div></section>
    <div className="container partner-dashboard-wrap">
      {submitted && <div className="partner-success" role="status"><strong>{success === "updated" ? "Application updated successfully." : "Application submitted successfully."}</strong><span>We’ll keep your status current on this dashboard.</span></div>}
      {!business ? <section className="partner-empty" aria-labelledby="partner-empty-title"><span className="partner-empty-icon" aria-hidden="true">✦</span><p>Join TourMate AI</p><h2 id="partner-empty-title">Ready to reach more travellers?</h2><span>Share your business details with our team to begin the partner review process.</span><Link className="button" href="/partner/apply">Apply to Become a Partner</Link></section> : <>
        <section className="partner-status-card" aria-labelledby="application-title"><div className="partner-status-heading"><div><p>Application overview</p><h2 id="application-title">{business.business_name}</h2></div><span className={`partner-status partner-status-${business.status}`}>{business.status}</span></div>
          <dl className="partner-details"><div><dt>Business name</dt><dd>{business.business_name}</dd></div><div><dt>Business type</dt><dd>{businessTypeLabel(business.business_type)}</dd></div><div><dt>Location</dt><dd>{business.city}, {business.country}</dd></div><div><dt>Application status</dt><dd>{business.status.charAt(0).toUpperCase() + business.status.slice(1)}</dd></div><div><dt>Submission date</dt><dd><time dateTime={business.created_at}>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(business.created_at))}</time></dd></div></dl>
          {business.status === "pending" && <Link className="button partner-edit" href="/partner/apply?edit=1">Edit Application</Link>}
        </section>
        {business.status === "approved" && <section className="partner-decision partner-decision-approved" aria-labelledby="partner-approved-title"><span className="partner-decision-icon" aria-hidden="true">✓</span><div><p>Application approved</p><h2 id="partner-approved-title">Your partnership is accepted</h2><h3>Next onboarding step</h3><span>Our partner team will contact you using your business email to complete onboarding and prepare your TourMate AI listing.</span></div></section>}
        {business.status === "rejected" && <section className="partner-decision partner-decision-rejected" aria-labelledby="partner-rejected-title"><span className="partner-decision-icon" aria-hidden="true">!</span><div><p>Application decision</p><h2 id="partner-rejected-title">Your application was not accepted</h2><h3>Reason from the review team</h3><blockquote>{business.rejection_reason}</blockquote><span>Review the reason above and contact our partner team if you need help correcting your information or requesting a new application.</span></div></section>}
        <section className="partner-status-guide" aria-labelledby="status-guide-title"><p>Review process</p><h2 id="status-guide-title">What each status means</h2><div className="partner-status-grid"><article><span className="partner-status partner-status-pending">Pending</span><h3>Your application is under review</h3><p>You can edit your details while our team reviews them.</p></article><article><span className="partner-status partner-status-approved">Approved</span><h3>Your partnership is accepted</h3><p>Your business is eligible for the next partner onboarding phase.</p></article><article><span className="partner-status partner-status-rejected">Rejected</span><h3>Your application was not accepted</h3><p>The submitted business is not eligible at this time and can no longer be edited.</p></article></div></section>
      </>}
    </div>
  </main></div>;
}
