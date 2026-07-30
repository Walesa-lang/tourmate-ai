import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Travel Guide | TourMate AI",
  description:
    "Preview TourMate AI's friendly travel guide for destination advice, trip planning, food, culture, safety, transport, and budgeting.",
};

const suggestions = [
  "What can I do in Livingstone?",
  "Help me plan a 5-day trip",
  "Is this destination safe?",
  "Find local food near me",
];

const tripDetails = [
  {
    label: "Current destination",
    value: "No destination selected",
    hint: "Tell the guide where you would like to go.",
    icon: "pin",
  },
  {
    label: "Trip dates",
    value: "Dates not added",
    hint: "Add dates when you are ready to plan.",
    icon: "calendar",
  },
  {
    label: "Budget",
    value: "Budget not set",
    hint: "Share a range for more useful suggestions.",
    icon: "wallet",
  },
  {
    label: "Travel preferences",
    value: "No preferences yet",
    hint: "Food, nature, culture, adventure—or anything else.",
    icon: "heart",
  },
];

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
      <span>
        TourMate <strong>AI</strong>
      </span>
    </Link>
  );
}

function DetailIcon({ name }: { name: string }) {
  if (name === "calendar") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM7 2v4M17 2v4M3 9h18" />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h15a2 2 0 0 1 2 2v12H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm17 5h-5a2 2 0 0 0 0 4h5" />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function AiGuidePage() {
  return (
    <div className="site-shell guide-page">
      <header className="guide-header">
        <nav className="nav container" aria-label="Main navigation">
          <Brand />
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/explore">Explore</Link>
            <Link className="active" href="/ai-guide" aria-current="page">
              AI Guide
            </Link>
            <Link href="/trip-planner">Trip Planner</Link>
          </div>
          <div className="nav-actions">
            <Link className="sign-in" href="/#footer">
              Sign In
            </Link>
            <Link className="button button-small" href="/trip-planner">
              Plan a Trip
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="guide-intro" aria-labelledby="guide-title">
          <div className="guide-orb guide-orb-one" />
          <div className="guide-orb guide-orb-two" />
          <div className="container guide-intro-content">
            <div className="eyebrow">
              <span aria-hidden="true">✦</span>
              Your smart travel companion
            </div>
            <h1 id="guide-title">Meet Your AI Travel Guide</h1>
            <p>
              Get friendly help with destinations, attractions, accommodation,
              local food, culture, safety, transport, budgeting, and planning
              every part of your trip.
            </p>
            <div className="preview-badge" role="status">
              <span aria-hidden="true">i</span>
              Preview experience — AI responses are not connected yet
            </div>
          </div>
        </section>

        <section className="guide-workspace" aria-label="AI guide preview">
          <div className="container guide-layout">
            <section className="chat-panel" aria-labelledby="chat-title">
              <header className="chat-header">
                <div className="assistant-avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 9h8M8 13h5M12 3a9 9 0 0 0-8 13l-1 5 5-2a9 9 0 1 0 4-16Z" />
                  </svg>
                </div>
                <div>
                  <h2 id="chat-title">TourMate AI</h2>
                  <p>
                    <span className="status-dot" aria-hidden="true" />
                    Preview mode
                  </p>
                </div>
              </header>

              <div className="chat-messages" aria-live="polite">
                <article className="message-row assistant-message">
                  <div className="message-avatar" aria-hidden="true">AI</div>
                  <div className="message-content">
                    <span>TourMate AI</span>
                    <p>
                      Hi! I&apos;m your TourMate AI guide. Tell me where you are
                      going—or what kind of trip you are dreaming about—and
                      I&apos;ll help you get started.
                    </p>
                  </div>
                </article>

                <article className="message-row user-message">
                  <div className="message-content">
                    <span>You</span>
                    <p>
                      I&apos;m visiting Livingstone for three days. What should
                      I make time for?
                    </p>
                  </div>
                  <div className="message-avatar" aria-hidden="true">You</div>
                </article>

                <article className="message-row assistant-message">
                  <div className="message-avatar" aria-hidden="true">AI</div>
                  <div className="message-content">
                    <span>TourMate AI</span>
                    <p>
                      Start with Victoria Falls, then consider a sunset cruise
                      on the Zambezi and a local market visit. Leave a flexible
                      half-day for a museum, café, or wildlife activity.
                    </p>
                  </div>
                </article>

                <article className="message-row user-message">
                  <div className="message-content">
                    <span>You</span>
                    <p>
                      Can you suggest local food and a budget-friendly way to
                      get around?
                    </p>
                  </div>
                  <div className="message-avatar" aria-hidden="true">You</div>
                </article>

                <article className="message-row assistant-message">
                  <div className="message-avatar" aria-hidden="true">AI</div>
                  <div className="message-content">
                    <span>TourMate AI</span>
                    <p>
                      Try nshima with a local relish, grilled fish, or seasonal
                      produce. Shared taxis can be economical, but agree on the
                      fare first and ask your accommodation about trusted
                      transport options.
                    </p>
                  </div>
                </article>
              </div>

              <div className="chat-composer">
                <div className="suggestions" aria-label="Suggested questions">
                  {suggestions.map((suggestion) => (
                    <button type="button" key={suggestion}>
                      {suggestion}
                    </button>
                  ))}
                </div>
                <form className="message-form">
                  <label htmlFor="travel-question">
                    Ask TourMate AI about your trip
                  </label>
                  <div className="message-input-row">
                    <input
                      id="travel-question"
                      name="travelQuestion"
                      type="text"
                      placeholder="Ask TourMate AI anything about your trip"
                    />
                    <button className="button send-button" type="button">
                      Send
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14" />
                      </svg>
                    </button>
                  </div>
                </form>
                <p className="preview-note">
                  Preview only. Messages are not sent or saved.
                </p>
              </div>
            </section>

            <aside className="trip-panel" aria-labelledby="trip-details-title">
              <div className="trip-panel-heading">
                <span>At a glance</span>
                <h2 id="trip-details-title">Your trip</h2>
                <p>
                  Your details will appear here as you plan with TourMate AI.
                </p>
              </div>
              <div className="trip-detail-list">
                {tripDetails.map((detail) => (
                  <section className="trip-detail" key={detail.label}>
                    <div className="trip-detail-icon">
                      <DetailIcon name={detail.icon} />
                    </div>
                    <div>
                      <h3>{detail.label}</h3>
                      <strong>{detail.value}</strong>
                      <p>{detail.hint}</p>
                    </div>
                  </section>
                ))}
              </div>
              <div className="trip-tip">
                <span aria-hidden="true">✦</span>
                <p>
                  <strong>Planning tip</strong>
                  Start with a destination and your approximate dates. You can
                  refine the details later.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-content">
          <Brand />
          <p>Explore the world with confidence.</p>
          <nav aria-label="Footer navigation">
            <Link href="/#footer">Privacy</Link>
            <Link href="/#footer">Terms</Link>
            <Link href="/#footer">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
