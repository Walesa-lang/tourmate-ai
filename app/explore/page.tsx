import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore Destinations | TourMate AI",
  description:
    "Discover inspiring destinations, attractions, culture, food, accommodation, and useful travel information with TourMate AI.",
};

const destinations = [
  {
    city: "Livingstone",
    country: "Zambia",
    description:
      "Feel the power of Victoria Falls and discover unforgettable wildlife adventures along the Zambezi.",
    category: "Adventure & Nature",
    scene: "livingstone",
    landmark: "VF",
  },
  {
    city: "Cape Town",
    country: "South Africa",
    description:
      "Explore dramatic coastlines, colourful neighbourhoods, vineyards, and iconic Table Mountain.",
    category: "City & Coast",
    scene: "cape-town",
    landmark: "TM",
  },
  {
    city: "Zanzibar",
    country: "Tanzania",
    description:
      "Unwind on turquoise shores and wander through the spice-scented lanes of historic Stone Town.",
    category: "Beach & Culture",
    scene: "zanzibar",
    landmark: "ZS",
  },
  {
    city: "Paris",
    country: "France",
    description:
      "Experience world-famous art, charming cafés, elegant boulevards, and timeless architecture.",
    category: "Culture & Romance",
    scene: "paris",
    landmark: "ET",
  },
  {
    city: "Dubai",
    country: "United Arab Emirates",
    description:
      "Discover bold modern landmarks, desert adventures, vibrant souks, and luxurious hospitality.",
    category: "Luxury & Adventure",
    scene: "dubai",
    landmark: "BK",
  },
  {
    city: "Tokyo",
    country: "Japan",
    description:
      "Meet a captivating mix of ancient temples, inventive food, neon districts, and quiet gardens.",
    category: "Food & Culture",
    scene: "tokyo",
    landmark: "TJ",
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

export default function ExplorePage() {
  return (
    <div className="site-shell explore-page">
      <header className="explore-header">
        <nav className="nav container" aria-label="Main navigation">
          <Brand />
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link className="active" href="/explore" aria-current="page">
              Explore
            </Link>
            <Link href="/ai-guide">AI Guide</Link>
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
        <section className="explore-hero">
          <div className="explore-orb explore-orb-one" />
          <div className="explore-orb explore-orb-two" />
          <div className="container explore-heading">
            <div className="eyebrow">
              <span aria-hidden="true">✦</span>
              Find your next adventure
            </div>
            <h1>Explore Amazing Destinations</h1>
            <p>
              Discover inspiring destinations, must-see attractions, local
              culture and food, comfortable accommodation, and useful travel
              information for every kind of journey.
            </p>
          </div>
        </section>

        <section
          className="destination-section"
          aria-labelledby="destination-results"
        >
          <div className="container">
            <form className="filter-panel" id="destination-search">
              <div className="filter-field filter-search">
                <label htmlFor="explore-search">Search destinations</label>
                <div className="explore-search-input">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                  <input
                    id="explore-search"
                    name="search"
                    type="search"
                    placeholder="Where would you like to go?"
                  />
                </div>
              </div>

              <div className="filter-field">
                <label htmlFor="country">Country</label>
                <select id="country" name="country" defaultValue="">
                  <option value="">All countries</option>
                  <option>Zambia</option>
                  <option>South Africa</option>
                  <option>Tanzania</option>
                  <option>France</option>
                  <option>United Arab Emirates</option>
                  <option>Japan</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="travel-type">Travel type</label>
                <select id="travel-type" name="travelType" defaultValue="">
                  <option value="">All travel types</option>
                  <option>Adventure</option>
                  <option>Beach</option>
                  <option>City break</option>
                  <option>Culture</option>
                  <option>Food</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="budget">Budget</label>
                <select id="budget" name="budget" defaultValue="">
                  <option value="">Any budget</option>
                  <option>Budget-friendly</option>
                  <option>Mid-range</option>
                  <option>Luxury</option>
                </select>
              </div>

              <button className="button filter-button" type="button">
                Search
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="results-heading">
              <div>
                <span>Handpicked for you</span>
                <h2 id="destination-results">Popular destinations</h2>
              </div>
              <p>6 destinations</p>
            </div>

            <div className="explore-grid">
              {destinations.map((destination) => (
                <article className="explore-card" key={destination.city}>
                  <div
                    className={`destination-scene scene-${destination.scene}`}
                    role="img"
                    aria-label={`Stylized view of ${destination.city}, ${destination.country}`}
                  >
                    <span className="scene-sun" />
                    <span className="scene-cloud" />
                    <span className="scene-landmark" aria-hidden="true">
                      {destination.landmark}
                    </span>
                    <span className="scene-land" />
                  </div>
                  <div className="explore-card-body">
                    <div className="category-row">
                      <span>{destination.category}</span>
                      <span className="card-rating" aria-label="4.9 out of 5">
                        ★ 4.9
                      </span>
                    </div>
                    <h3>{destination.city}</h3>
                    <div className="country">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      {destination.country}
                    </div>
                    <p>{destination.description}</p>
                    <a className="destination-button" href="#destination-search">
                      Explore Destination
                      <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-content">
          <Brand />
          <p>Explore the world with confidence.</p>
          <nav aria-label="Footer navigation">
            <a href="#destination-search">Privacy</a>
            <a href="#destination-search">Terms</a>
            <a href="#destination-search">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
