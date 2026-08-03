import { SiteNavigation } from "../components/site-navigation";

export default function DashboardLoading() {
  return (
    <div className="site-shell dashboard-page" aria-busy="true">
      <SiteNavigation headerClassName="dashboard-header" />
      <main className="dashboard-loading-main">
        <div className="container dashboard-loading" role="status" aria-live="polite">
          <span className="dashboard-loading-spinner" aria-hidden="true" />
          <h1>Checking your account</h1>
          <p>Preparing your travel dashboard…</p>
        </div>
      </main>
    </div>
  );
}
