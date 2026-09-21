import Link from "next/link";
import { SavedRecommendations } from "@/app/components/saved-recommendations";
import { TravelIcon, SectionHeading } from "@/app/components/traveller-ui";
import type { Database } from "@/utils/supabase/database.types";

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

export function DashboardContent({ greetingName, savedTrips }: DashboardContentProps) {
  return <main className="dashboard-main traveller-dashboard">
    <section className="dashboard-welcome" aria-labelledby="dashboard-title">
      <div className="container dashboard-welcome-content">
        <div><p className="traveller-eyebrow">Your Namibia travel space</p><h1 id="dashboard-title"><span>Welcome back,</span> {greetingName}</h1><p>A little inspiration, your personal preferences, and the places you want to remember.</p></div>
        <Link className="button dashboard-primary-action" href="/ai-guide">Ask the Assistant <span aria-hidden="true">→</span></Link>
      </div>
    </section>
    <div className="container dashboard-body">
      <section className="traveller-panel profile-summary" aria-labelledby="profile-summary-title">
        <span className="traveller-icon-tile"><TravelIcon name="profile" /></span>
        <div><p className="traveller-eyebrow">Made personal by you</p><h2 id="profile-summary-title">Your profile. Your choices.</h2><p>Review your travel preferences and choose what the Assistant may use. Optional details stay in your profile.</p></div>
        <Link className="traveller-button-secondary" href="/profile">Review travel profile <span aria-hidden="true">→</span></Link>
      </section>
      <SavedRecommendations />
      {savedTrips.length > 0 && <section aria-labelledby="trip-notes-title"><SectionHeading id="trip-notes-title" title="Your trip notes" eyebrow="Previously saved" /><div className="saved-grid">{savedTrips.map(trip => <article className="traveller-panel" key={trip.id}><p className="traveller-eyebrow">{trip.destination}</p><h3>{trip.title}</h3><p>{trip.start_date && trip.end_date ? `${trip.start_date} – ${trip.end_date}` : "Dates flexible"} · {trip.travellers} travellers</p></article>)}</div></section>}
      <aside className="dashboard-support"><TravelIcon name="shield" /><div><h2>A starting point for your journey</h2><p>The Assistant is a demo. Confirm details with providers before travelling. Conversations stay in your current browser tab.</p></div><Link href="/explore">Explore Namibia <span aria-hidden="true">→</span></Link></aside>
      <footer className="traveller-footer"><span>TourMate AI · Namibia, at your pace.</span><Link href="/partner/dashboard">Partner Portal</Link></footer>
    </div>
  </main>;
}
