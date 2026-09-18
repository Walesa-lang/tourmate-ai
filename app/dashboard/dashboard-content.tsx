import Link from "next/link";
import type { Database } from "@/utils/supabase/database.types";
import { ExpeditionIcon } from "../components/adventure-ui";

type SavedTrip = Pick<Database["public"]["Tables"]["saved_trips"]["Row"], "id" | "title" | "destination" | "start_date" | "end_date" | "travellers" | "budget" | "created_at">;
type Favourite = Pick<Database["public"]["Tables"]["favourites"]["Row"], "id" | "item_type" | "item_id" | "item_snapshot" | "created_at">;

type DashboardContentProps = {
  fullName: string;
  email: string;
  greetingName: string;
  plan: "free" | "plus" | "premium";
  savedTrips: SavedTrip[];
  favourites: Favourite[];
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

function snapshotValue(favourite: Favourite, key: string) {
  const snapshot = favourite.item_snapshot;
  if (!snapshot || Array.isArray(snapshot) || typeof snapshot !== "object") return "";
  const value = snapshot[key];
  return typeof value === "string" ? value : "";
}

function FavouriteCollection({ favourites, type }: { favourites: Favourite[]; type: "hotel" | "attraction" }) {
  const href = type === "hotel" ? "/hotels" : "/attractions";
  const icon = type;
  if (favourites.length === 0) {
    return <EmptyCollection icon={icon} title={type === "hotel" ? "No favourite hotels yet" : "No favourite attractions yet"} description={type === "hotel" ? "Hotels you favourite will appear here." : "Attractions you favourite will appear here."} action={type === "hotel" ? "Explore hotels" : "Explore attractions"} href={href} />;
  }

  return (
    <div className="dashboard-favourite-list">
      {favourites.map((favourite) => (
        <article className="dashboard-favourite-item" key={favourite.id}>
          <span className={`dashboard-favourite-icon dashboard-favourite-icon-${type}`}><DashboardIcon name={icon} /></span>
          <div>
            <p>{snapshotValue(favourite, type === "hotel" ? "type" : "category") || (type === "hotel" ? "Hotel" : "Attraction")}</p>
            <h3>{snapshotValue(favourite, "name") || favourite.item_id}</h3>
            <span>{snapshotValue(favourite, "location")}</span>
            <div className="dashboard-favourite-meta">
              {snapshotValue(favourite, "price") && <small>Illustrative price: {snapshotValue(favourite, "price")}</small>}
              {snapshotValue(favourite, "duration") && <small>{snapshotValue(favourite, "duration")}</small>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function DashboardContent({ fullName, email, greetingName, plan, savedTrips, favourites }: DashboardContentProps) {
  const planName = `${plan.charAt(0).toUpperCase()}${plan.slice(1)}`;
  const favouriteHotels = favourites.filter((item) => item.item_type === "hotel");
  const favouriteAttractions = favourites.filter((item) => item.item_type === "attraction");
  const discoveries = Number(favouriteHotels.length > 0) + Number(favouriteAttractions.length > 0);
  const overview = [
    { label: "Saved trips", value: String(savedTrips.length), icon: "trip" as const },
    { label: "Favourite hotels", value: String(favouriteHotels.length), icon: "hotel" as const },
    { label: "Favourite attractions", value: String(favouriteAttractions.length), icon: "attraction" as const },
    { label: "Current plan", value: planName, icon: "plan" as const },
  ];

  return (
    <main className="dashboard-main">
      <section className="dashboard-welcome" aria-labelledby="dashboard-title">
        <div className="dashboard-welcome-orb" aria-hidden="true" />
        <div className="container dashboard-welcome-content">
          <div>
            <p className="dashboard-eyebrow"><span aria-hidden="true">✦</span> YOUR EXPEDITION JOURNAL</p>
            <h1 id="dashboard-title">My Namibia Journey<span> · {greetingName}</span></h1>
            <p>Your saved discoveries and earlier trip notes live here. Your Assistant conversation stays only in the current browser tab.</p>
          </div>
          <Link className="button dashboard-primary-action" href="/ai-guide"><ExpeditionIcon name="spark" size={17} /> Ask your guide<span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <div className="container dashboard-body">
        <section className="journey-progress-panel" aria-labelledby="journey-progress-title"><div className="journey-progress-copy"><span className="adventure-eyebrow">Your discoveries</span><h2 id="journey-progress-title">{discoveries === 0 ? "Every journey begins somewhere." : discoveries === 1 ? "Your journey is taking shape." : "Two kinds of places, one growing journey."}</h2><p>Save a sample stay and an activity to collect both discovery stamps. This progress reflects only places you have actually saved.</p><div className="journey-progress-track" role="progressbar" aria-valuenow={discoveries} aria-valuemin={0} aria-valuemax={2} aria-label="Discovery types saved"><span style={{ width: `${discoveries * 50}%` }} /></div><small>{discoveries} of 2 discovery types saved</small></div><div className="journey-stamps" aria-label="Discovery stamps"><Link className={favouriteHotels.length > 0 ? "is-earned" : ""} href="/hotels"><ExpeditionIcon name="moon" size={25} /><strong>Stay finder</strong><span>{favouriteHotels.length > 0 ? "Saved" : "Explore stays"}</span></Link><Link className={favouriteAttractions.length > 0 ? "is-earned" : ""} href="/attractions"><ExpeditionIcon name="compass" size={25} /><strong>Experience seeker</strong><span>{favouriteAttractions.length > 0 ? "Saved" : "Explore activities"}</span></Link></div></section>
        <section className="dashboard-overview" aria-labelledby="overview-title">
          <div className="dashboard-section-heading dashboard-visually-titled"><div><p>Your field notes</p><h2 id="overview-title">Your journey at a glance</h2></div><Link href="/explore">Continue exploring →</Link></div>
          <div className="dashboard-stat-grid">
            {overview.map((item) => <article className="dashboard-stat" key={item.label}><span className={`dashboard-stat-icon dashboard-stat-icon-${item.icon}`}><DashboardIcon name={item.icon} /></span><div><strong>{item.value}</strong><p>{item.label}</p></div></article>)}
          </div>
        </section>

        <div className="dashboard-content-grid" id="saved">
          <section className="dashboard-collection-card dashboard-trips-card" aria-labelledby="saved-trips-title">
            <div className="dashboard-section-heading"><div><p>From earlier planning</p><h2 id="saved-trips-title">Saved trip notes</h2></div></div>
            {savedTrips.length === 0 ? (
              <div className="dashboard-empty-state"><span className="dashboard-empty-icon"><DashboardIcon name="trip" /></span><h3>No saved trip notes yet</h3><p>Previously saved trips will appear here. Ask the Assistant for new Namibia ideas.</p><Link className="dashboard-text-link" href="/ai-guide">Open Assistant<span aria-hidden="true">→</span></Link></div>
            ) : (
              <div className="dashboard-trip-list">
                {savedTrips.map((trip) => (
                  <article className="dashboard-trip-item" key={trip.id}>
                    <span className="dashboard-trip-icon"><DashboardIcon name="trip" /></span>
                    <div className="dashboard-trip-copy">
                      <p>{trip.destination}</p>
                      <h3>{trip.title}</h3>
                      <div className="dashboard-trip-meta">
                        <span>{trip.start_date && trip.end_date ? `${trip.start_date} – ${trip.end_date}` : "Dates flexible"}</span>
                        <span>{trip.travellers} {trip.travellers === 1 ? "traveller" : "travellers"}</span>
                        {trip.budget && <span>{trip.budget.charAt(0).toUpperCase() + trip.budget.slice(1)}</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-collection-card" aria-labelledby="favourite-hotels-title">
            <div className="dashboard-section-heading"><div><p>Places to stay</p><h2 id="favourite-hotels-title">Favourite hotels</h2></div></div>
            <FavouriteCollection favourites={favouriteHotels} type="hotel" />
          </section>

          <section className="dashboard-collection-card" aria-labelledby="favourite-attractions-title">
            <div className="dashboard-section-heading"><div><p>Things to experience</p><h2 id="favourite-attractions-title">Favourite attractions</h2></div></div>
            <FavouriteCollection favourites={favouriteAttractions} type="attraction" />
          </section>

          <aside className="dashboard-sidebar" aria-label="Profile and account">
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
              <p>Explore destinations and try the Assistant demo on your current plan.</p>
              <button type="button" disabled>Upgrade — coming soon</button>
              <small>No payment processing is active.</small>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
