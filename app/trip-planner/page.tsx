import type { Metadata } from "next";
import Link from "next/link";
import TripPlanner from "./trip-planner";

export const metadata: Metadata = {
  title: "Trip Planner | TourMate AI",
  description: "Create a personalized Namibia itinerary with TourMate AI.",
};

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="TourMate AI home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="10.5" />
          <path d="M3.5 14h21M14 3.5c3 3.2 4.5 6.7 4.5 10.5S17 21.3 14 24.5c-3-3.2-4.5-6.7-4.5-10.5S11 6.7 14 3.5Z" />
          <path d="m17.8 7.7-2.3 5.8-5.8 2.3 2.3-5.8 5.8-2.3Z" />
        </svg>
      </span>
      <span>TourMate <strong>AI</strong></span>
    </Link>
  );
}

export default function TripPlannerPage() {
  return (
    <div className="site-shell planner-page">
      <header className="planner-header">
        <nav className="nav container" aria-label="Main navigation">
          <Brand />
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/explore">Explore</Link>
            <Link href="/ai-guide">AI Guide</Link>
            <Link href="/hotels">Hotels</Link>
            <Link href="/attractions">Attractions</Link>
            <Link className="active" href="/trip-planner" aria-current="page">Trip Planner</Link>
          </div>
          <div className="nav-actions">
            <Link className="sign-in" href="/#footer">Sign In</Link>
            <a className="button button-small" href="#planner-form">Plan a Trip <span aria-hidden="true">→</span></a>
          </div>
        </nav>
      </header>

      <main>
        <section className="planner-hero" aria-labelledby="planner-title">
          <div className="planner-orb planner-orb-one" />
          <div className="planner-orb planner-orb-two" />
          <div className="container planner-hero-content">
            <div className="eyebrow"><span aria-hidden="true">✦</span> Namibia launch edition</div>
            <h1 id="planner-title">Plan Your Perfect Trip</h1>
            <p>Tell TourMate AI how you like to travel and we&apos;ll shape a personalized itinerary around your dates, budget, and interests.</p>
            <ol className="planner-progress" aria-label="Trip planning steps">
              <li className="current"><span>1</span><strong>Trip details</strong></li>
              <li><span>2</span><strong>Personalize</strong></li>
              <li><span>3</span><strong>Your itinerary</strong></li>
            </ol>
          </div>
        </section>
        <TripPlanner />
      </main>

      <footer className="site-footer">
        <div className="container footer-content">
          <Brand />
          <p>Explore the world with confidence.</p>
          <nav aria-label="Footer navigation">
            <Link href="/#footer">Privacy</Link><Link href="/#footer">Terms</Link><Link href="/#footer">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
