import Link from "next/link";
import { SiteNavigation } from "./components/site-navigation";

const features = [
  {
    title: "AI Travel Guide",
    description:
      "Ask the demo assistant for Namibia trip ideas, places to stay, and practical travel guidance.",
    color: "blue",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a7 7 0 0 0-4 12.74V19a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3.26A7 7 0 0 0 12 3Z" />
        <path d="M9 17h6M12 1v1M4.22 4.22l1.42 1.42M19.78 4.22l-1.42 1.42M2 12h2M20 12h2" />
      </svg>
    ),
  },
  {
    title: "Places to Explore",
    description:
      "Browse a curated introduction to Namibia's destinations and experiences.",
    color: "turquoise",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Local Food and Culture",
    description:
      "Find ideas for local food and culture to research before you travel.",
    color: "orange",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18M16 3c3 1 4 4 4 7h-4" />
      </svg>
    ),
  },
  {
    title: "Practical Travel Guidance",
    description:
      "Get general preparation tips, then confirm current conditions with official sources.",
    color: "navy",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
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

export default function Home() {
  return (
    <div className="site-shell">
      <SiteNavigation headerClassName="site-header" />

      <main>
        <section className="hero" id="home">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-grid container">
            <div className="hero-copy">
              <div className="eyebrow">
                <span aria-hidden="true">✦</span>
                Discover Namibia with TourMate AI
              </div>
              <h1>
                Explore Namibia with{" "}
                <span>a travel assistant by your side</span>
              </h1>
              <p>
                Browse ideas for places and experiences, then ask our demo assistant
                for help shaping a Namibia journey. Use its answers as a starting
                point and confirm details before you travel.
              </p>

              <div className="home-cta-row">
                <Link className="button plan-button" href="/ai-guide">Ask the Assistant <span aria-hidden="true">→</span></Link>
                <Link className="home-explore-link" href="/explore">Explore destinations <span aria-hidden="true">→</span></Link>
              </div>
            </div>

            <div className="hero-visual" aria-label="Travel illustration">
              <div className="sun" />
              <div className="cloud cloud-one" />
              <div className="cloud cloud-two" />
              <svg
                className="flight-path"
                viewBox="0 0 500 500"
                aria-hidden="true"
              >
                <path d="M58 128c85-74 197-43 198 51 1 103 113 137 199 83" />
              </svg>
              <div className="plane" aria-hidden="true">
                ✈
              </div>
              <div className="destination-card card-paris">
                <div className="destination-art namibia-city-art">
                  <span aria-hidden="true">WH</span>
                </div>
                <div>
                  <small>Discover Namibia</small>
                  <strong>Windhoek</strong>
                </div>
              </div>
              <div className="destination-card card-bali">
                <div className="destination-art namibia-dune-art">
                  <span aria-hidden="true">☀</span>
                </div>
                <div>
                  <small>Discover Namibia</small>
                  <strong>Sossusvlei</strong>
                </div>
              </div>
              <div className="compass" aria-hidden="true">
                <span>N</span>
                <strong>➤</strong>
              </div>
              <div className="map-pin" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </div>
            </div>
          </div>
          <div className="hero-wave" />
        </section>

        <section className="features" id="explore">
          <div className="container">
            <div className="section-heading" id="ai-guide">
              <span>Everything you need, in one place</span>
              <h2>Travel smarter. Experience more.</h2>
              <p>
                Start with curated ideas and use the demo assistant for general
                guidance as you explore Namibia.
              </p>
            </div>
            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.title}>
                  <div className={`feature-icon ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <Link
                    href={
                      feature.title === "AI Travel Guide"
                        ? "/ai-guide"
                        : "/explore"
                    }
                  >
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="footer">
        <div className="container footer-content">
          <Brand />
          <p>Discover Namibia, one idea at a time.</p>
          <nav aria-label="Footer navigation">
            <Link href="/ai-guide">Assistant</Link>
            <Link href="/explore">Explore</Link>
            <Link href="/partner/apply">Partners</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
