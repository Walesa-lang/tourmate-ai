import type { Metadata } from "next";
import Link from "next/link";
import { SiteNavigation } from "../components/site-navigation";
import { AiGuideChat } from "./ai-guide-chat";

export const metadata: Metadata = {
  title: "AI Travel Guide | TourMate AI",
  description:
    "Try TourMate AI's demo assistant for Namibia destinations, sample stays, activities, routes, and general travel preparation.",
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

export default function AiGuidePage() {
  return (
    <div className="site-shell guide-page">
      <SiteNavigation headerClassName="guide-header" />
      <main>
        <section className="guide-intro" aria-labelledby="guide-title">
          <div className="guide-orb guide-orb-one" />
          <div className="guide-orb guide-orb-two" />
          <div className="container guide-intro-content">
            <div className="eyebrow"><span aria-hidden="true">✦</span>Explore Namibia</div>
            <h1 id="guide-title">Ask the TourMate Assistant</h1>
            <p>Try questions about Namibia destinations, sample stays, activities, routes, and general travel preparation. Verify current details with providers and official sources.</p>
            <div className="preview-badge" role="status">
              <span aria-hidden="true">i</span>
              Demo mode — responses are simulated and real-time information is not active
            </div>
          </div>
        </section>
        <AiGuideChat />
      </main>
      <footer className="site-footer">
        <div className="container footer-content">
          <Brand />
          <p>Discover Namibia, one idea at a time.</p>
          <nav aria-label="Footer navigation">
            <Link href="/">Home</Link><Link href="/explore">Explore</Link><Link href="/partner/apply">Partners</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
