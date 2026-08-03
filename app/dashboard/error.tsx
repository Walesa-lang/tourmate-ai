"use client";

import Link from "next/link";
import { SiteNavigation } from "../components/site-navigation";

export default function DashboardError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <div className="site-shell dashboard-page">
      <SiteNavigation headerClassName="dashboard-header" />
      <main className="dashboard-error-main">
        <section className="dashboard-error-card" aria-labelledby="dashboard-error-title" role="alert">
          <span aria-hidden="true">!</span>
          <p className="dashboard-card-kicker">Dashboard unavailable</p>
          <h1 id="dashboard-error-title">We could not load your dashboard</h1>
          <p>Your account is safe. This may be a temporary connection problem.</p>
          <div><button className="button" type="button" onClick={() => unstable_retry()}>Try again</button><Link href="/">Return home</Link></div>
        </section>
      </main>
    </div>
  );
}
