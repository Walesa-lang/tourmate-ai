import Link from "next/link";

type DashboardContentProps = {
  fullName: string;
  email: string;
  greetingName: string;
  plan: "free" | "plus" | "premium";
};
type IconName = "trip" | "hotel" | "attraction" | "plan" | "user";

function DashboardIcon({ name }: { name: IconName }) {
  if (name === "hotel") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V5h16v15M4 14h16M8 9h2M14 9h2M8 17h2M14 17h2" /></svg>;
  if (name === "attraction") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7L6.8 19l1-5.8-4.2-4.1 5.8-.8L12 3Z" /></svg>;
  if (name === "plan") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 3v4M17 3v4M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Zm3 7h3M8 16h6" /></svg>;
  if (name === "user") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11l3 3v13H5V4Zm11 0v4h3M8 12h8M8 16h5" /></svg>;
}

function EmptyCollection({ icon, title, description, action, href }: { icon: IconName; title: string; description: string; action: string; href: string }) {
  return (
    <div className="dashboard-empty-state">
      <span className="dashboard-empty-icon"><DashboardIcon name={icon} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link className="dashboard-text-link" href={href}>{action}<span aria-hidden="true">→</span></Link>
    </div>
  );
}

export function DashboardContent({ fullName, email, greetingName, plan }: DashboardContentProps) {
  const planName = `${plan.charAt(0).toUpperCase()}${plan.slice(1)}`;
  const overview = [
    { label: "Saved trips", value: "0", icon: "trip" as const },
    { label: "Favourite hotels", value: "0", icon: "hotel" as const },
    { label: "Favourite attractions", value: "0", icon: "attraction" as const },
    { label: "Current plan", value: planName, icon: "plan" as const },
  ];

  return (
    <main className="dashboard-main">
      <section className="dashboard-welcome" aria-labelledby="dashboard-title">
        <div className="dashboard-welcome-orb" aria-hidden="true" />
        <div className="container dashboard-welcome-content">
          <div>
            <p className="dashboard-eyebrow"><span aria-hidden="true">✦</span>Your travel space</p>
            <h1 id="dashboard-title"><span>Welcome back,</span> {greetingName}</h1>
            <p>Plan what is next and keep your future TourMate favourites together in one calm, organised place.</p>
          </div>
          <Link className="button dashboard-primary-action" href="/trip-planner">Create a trip<span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <div className="container dashboard-body">
        <section className="dashboard-overview" aria-labelledby="overview-title">
          <div className="dashboard-section-heading dashboard-visually-titled"><div><p>At a glance</p><h2 id="overview-title">Your overview</h2></div></div>
          <div className="dashboard-stat-grid">
            {overview.map((item) => <article className="dashboard-stat" key={item.label}><span className={`dashboard-stat-icon dashboard-stat-icon-${item.icon}`}><DashboardIcon name={item.icon} /></span><div><strong>{item.value}</strong><p>{item.label}</p></div></article>)}
          </div>
        </section>

        <div className="dashboard-content-grid">
          <section className="dashboard-collection-card dashboard-trips-card" aria-labelledby="saved-trips-title">
            <div className="dashboard-section-heading"><div><p>Your journeys</p><h2 id="saved-trips-title">Recent and saved trips</h2></div><Link href="/trip-planner">Create a trip</Link></div>
            <EmptyCollection icon="trip" title="No saved trips yet" description="Trips you save will appear here when trip storage is connected." action="Plan your first trip" href="/trip-planner" />
          </section>

          <section className="dashboard-collection-card" aria-labelledby="favourite-hotels-title">
            <div className="dashboard-section-heading"><div><p>Places to stay</p><h2 id="favourite-hotels-title">Favourite hotels</h2></div></div>
            <EmptyCollection icon="hotel" title="No favourite hotels yet" description="Your saved accommodation will appear here when favourites are available." action="Explore hotels" href="/hotels" />
          </section>

          <section className="dashboard-collection-card" aria-labelledby="favourite-attractions-title">
            <div className="dashboard-section-heading"><div><p>Things to experience</p><h2 id="favourite-attractions-title">Favourite attractions</h2></div></div>
            <EmptyCollection icon="attraction" title="No favourite attractions yet" description="Your saved experiences will appear here when favourites are available." action="Explore attractions" href="/attractions" />
          </section>

          <aside className="dashboard-sidebar" aria-label="Account and subscription">
            <section className="dashboard-profile-card" aria-labelledby="profile-title">
              <div className="dashboard-card-icon"><DashboardIcon name="user" /></div>
              <p className="dashboard-card-kicker">Your account</p>
              <h2 id="profile-title">{fullName ? "Manage profile" : "Complete your profile"}</h2>
              <dl className="dashboard-profile-details">
                <div><dt>Full name</dt><dd>{fullName || "Not added yet"}</dd></div>
                <div><dt>Email</dt><dd>{email}</dd></div>
                <div><dt>Current plan</dt><dd>{planName}</dd></div>
              </dl>
              <p className="dashboard-profile-note">Email editing is not available yet.</p>
              <button className="dashboard-secondary-button" type="button" disabled aria-describedby="profile-action-note">Profile editing coming soon</button>
              <span id="profile-action-note" className="sr-only">Profile editing will be available in a future update.</span>
            </section>

            <section className="dashboard-plan-card" aria-labelledby="plan-title">
              <span className="dashboard-plan-badge">Current plan</span>
              <h2 id="plan-title">{planName}</h2>
              <p>Core trip planning tools are available on your current plan.</p>
              <button type="button" disabled>Upgrade — coming soon</button>
              <small>No payment processing is active.</small>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
