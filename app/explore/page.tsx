import type { Metadata } from "next";
import Link from "next/link";
import { SiteNavigation } from "../components/site-navigation";

export const metadata: Metadata = {
  title: "Explore Namibia | TourMate AI",
  description:
    "Browse a curated introduction to Namibia destinations with TourMate AI.",
};

const destinations = [
  {
    city: "Windhoek",
    country: "Namibia",
    description:
      "Explore Namibia's capital, its markets, museums, cafés, and nearby landscapes.",
    category: "Adventure & Nature",
    scene: "windhoek",
    landmark: "WH",
  },
  {
    city: "Swakopmund",
    country: "Namibia",
    description:
      "Discover Atlantic coast views and a base for desert activities.",
    category: "City & Coast",
    scene: "swakopmund",
    landmark: "SW",
  },
  {
    city: "Walvis Bay",
    country: "Namibia",
    description:
      "Look for lagoon birdlife, coastal scenery, and nearby dunes.",
    category: "Beach & Culture",
    scene: "walvis-bay",
    landmark: "WB",
  },
  {
    city: "Sossusvlei",
    country: "Namibia",
    description:
      "Discover towering dunes and the distinctive landscapes of the Namib Desert.",
    category: "Culture & Romance",
    scene: "sossusvlei",
    landmark: "SV",
  },
  {
    city: "Etosha",
    country: "Namibia",
    description:
      "Learn about wildlife viewing around the national park's waterholes.",
    category: "Luxury & Adventure",
    scene: "etosha",
    landmark: "ET",
  },
  {
    city: "Fish River Canyon",
    country: "Namibia",
    description:
      "Explore sweeping canyon viewpoints in southern Namibia.",
    category: "Food & Culture",
    scene: "fish-river",
    landmark: "FR",
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
      <SiteNavigation headerClassName="explore-header" />

      <main>
        <section className="explore-hero">
          <div className="explore-orb explore-orb-one" />
          <div className="explore-orb explore-orb-two" />
          <div className="container explore-heading">
            <div className="eyebrow">
              <span aria-hidden="true">✦</span>
              Find your next adventure
            </div>
            <h1>Explore Namibia</h1>
            <p>
              Browse a curated starting point for Namibia. These destination
              descriptions are guides, not live travel updates.
            </p>
          </div>
        </section>

        <section
          className="destination-section"
          aria-labelledby="destination-results"
        >
          <div className="container">
            <form className="filter-panel" id="destination-search" aria-label="Destination search preview">
              <fieldset className="catalogue-preview-fields" disabled>
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
                  <option>Namibia</option>
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

              <button className="button filter-button" type="button" disabled title="Catalogue search is coming soon">
                Search preview
                <span aria-hidden="true">→</span>
              </button>
              </fieldset>
            </form>

            <div className="results-heading">
              <div>
                <span>Curated destination ideas · search preview only</span>
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
                      <span className="card-rating">Travel idea</span>
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
                    <Link className="destination-button" href="/ai-guide">
                      Ask about this place
                      <span aria-hidden="true">→</span>
                    </Link>
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
          <p>Discover Namibia, one idea at a time.</p>
          <nav aria-label="Footer navigation">
            <Link href="/">Home</Link>
            <Link href="/ai-guide">Assistant</Link>
            <Link href="/partner/apply">Partners</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
