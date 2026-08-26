import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/utils/supabase/admin";
import { businessTypeLabel } from "@/app/partner/business";
import { AdminHeader } from "./admin-header";
import { adminFilters, parseAdminFilter } from "./review";

export const metadata: Metadata = { title: "Partner Applications | TourMate AI Admin", description: "Review TourMate AI business partner applications." };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase, user } = await requireAdmin();
  const filter = parseAdminFilter((await searchParams).status);
  let query = supabase.from("businesses").select("*").order("created_at", { ascending: false });
  if (filter !== "all") query = query.eq("status", filter);
  const { data: applications, error } = await query;
  if (error) throw new Error("Unable to load partner applications.");

  return <div className="site-shell admin-page"><AdminHeader email={user.email} /><main className="admin-main"><section className="admin-hero"><div className="container"><p>Partner operations</p><h1>Business applications</h1><span>Review applicants securely and keep partner decisions moving.</span></div></section><div className="container admin-content">
    <nav className="admin-filters" aria-label="Filter applications">{adminFilters.map((status) => <Link key={status} href={status === "pending" ? "/admin" : `/admin?status=${status}`} aria-current={filter === status ? "page" : undefined}>{status.charAt(0).toUpperCase() + status.slice(1)}</Link>)}</nav>
    <div className="admin-list-heading"><div><p>Application queue</p><h2>{filter.charAt(0).toUpperCase() + filter.slice(1)} applications</h2></div><span>{applications.length} {applications.length === 1 ? "application" : "applications"}</span></div>
    {applications.length === 0 ? <section className="admin-empty"><span aria-hidden="true">✓</span><h2>No {filter === "all" ? "partner" : filter} applications</h2><p>The queue is clear for this filter.</p></section> : <div className="admin-application-list">{applications.map((application) => <article className="admin-application-card" key={application.id}><div className="admin-card-primary"><span className={`partner-status partner-status-${application.status}`}>{application.status}</span><h3><Link href={`/admin/applications/${application.id}`}>{application.business_name}</Link></h3><p>{application.contact_name} · {businessTypeLabel(application.business_type)}</p></div><dl><div><dt>Email</dt><dd><a href={`mailto:${application.contact_email}`}>{application.contact_email}</a></dd></div><div><dt>Phone</dt><dd><a href={`tel:${application.phone}`}>{application.phone}</a></dd></div><div><dt>Submitted</dt><dd><time dateTime={application.created_at}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(application.created_at))}</time></dd></div></dl><Link className="admin-review-link" href={`/admin/applications/${application.id}`}>Open application<span aria-hidden="true"> →</span></Link></article>)}</div>}
  </div></main></div>;
}
