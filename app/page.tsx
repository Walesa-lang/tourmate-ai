import Link from "next/link";

const features = [
  {
    title: "AI Travel Guide",
    description:
      "Get personal recommendations and helpful answers tailored to your travel style.",
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
      "Discover famous landmarks, hidden gems, and unforgettable places wherever you go.",
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
      "Taste authentic local dishes and understand the traditions that make each place unique.",
    color: "orange",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18M16 3c3 1 4 4 4 7h-4" />
      </svg>
    ),
  },
  {
    title: "Safety and Real-Time Updates",
    description:
      "Travel confidently with practical safety advice and timely guidance for your destination.",
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
      <header className="site-header">
        <nav className="nav container" aria-label="Main navigation">
          <Brand />
          <div className="nav-links">
            <a className="active" href="#home">
              Home
            </a>
            <Link href="/explore">Explore</Link>
            <Link href="/ai-guide">AI Guide</Link>
            <Link href="/hotels">Hotels</Link>
            <Link href="/trip-planner">Trip Planner</Link>
          </div>
          <div className="nav-actions">
            <a className="sign-in" href="#footer">
              Sign In
            </a>
            <Link className="button button-small" href="/trip-planner">
              Plan a Trip
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-grid container">
            <div className="hero-copy">
              <div className="eyebrow">
                <span aria-hidden="true">✦</span>
                Your smarter way to travel
              </div>
              <h1>
                Your AI Travel Companion,{" "}
                <span>Anywhere in the World</span>
              </h1>
              <p>
                Discover must-see attractions, local restaurants, welcoming
                stays, authentic culture, and practical safety information—all
                with real-time travel guidance by your side.
              </p>

              <form className="search-card" id="trip-search">
                <label htmlFor="destination">Where do you want to go?</label>
                <div className="search-row">
                  <div className="search-input">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-4-4" />
                    </svg>
                    <input
                      id="destination"
                      name="destination"
                      type="search"
                      placeholder="Search a city or destination"
                    />
                  </div>
                  <Link className="button plan-button" href="/trip-planner">
                    Plan My Trip
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className="popular">
                  <span>Popular:</span>
                  <a href="#trip-search">Paris</a>
                  <a href="#trip-search">Tokyo</a>
                  <a href="#trip-search">Bali</a>
                  <a href="#trip-search">New York</a>
                </div>
              </form>

              <div className="trust-row">
                <div className="avatar-stack" aria-hidden="true">
                  <span>AM</span>
                  <span>JL</span>
                  <span>SK</span>
                </div>
                <div>
                  <div className="stars" aria-label="5 out of 5 stars">
                    ★★★★★
                  </div>
                  <p>Trusted by curious travellers worldwide</p>
                </div>
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
                <div className="destination-art paris-art">
                  <span className="eiffel">♜</span>
                </div>
                <div>
                  <small>Top destination</small>
                  <strong>Paris, France</strong>
                  <span>★ 4.9</span>
                </div>
              </div>
              <div className="destination-card card-bali">
                <div className="destination-art bali-art">
                  <span>☀</span>
                </div>
                <div>
                  <small>Trending now</small>
                  <strong>Bali, Indonesia</strong>
                  <span>★ 4.8</span>
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
                From your first idea to your journey home, TourMate AI helps
                make every trip simpler, safer, and more memorable.
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
          <p>Explore the world with confidence.</p>
          <nav aria-label="Footer navigation">
            <a href="#footer">Privacy</a>
            <a href="#footer">Terms</a>
            <a href="#footer">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
