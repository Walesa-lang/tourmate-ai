import Link from "next/link";
import { SiteNavigation } from "./components/site-navigation";
import { AdventureFooter, ExpeditionIcon, ExpeditionLandscape, SectionHeading } from "./components/adventure-ui";

const missions = [
  { number: "01", icon: "compass" as const, title: "Choose your direction", description: "Get to know Namibia's deserts, coast, wildlife areas, and cities.", href: "/explore", action: "Explore regions" },
  { number: "02", icon: "spark" as const, title: "Ask your expedition guide", description: "Try a route, activity, or travel-preparation question in the Assistant demo.", href: "/ai-guide", action: "Ask the Assistant" },
  { number: "03", icon: "heart" as const, title: "Keep what inspires you", description: "Sign in to save sample stays and activities to your journey hub.", href: "/hotels", action: "Discover stays" },
];

export default function Home() {
  return (
    <div className="site-shell adventure-shell home-page">
      <SiteNavigation headerClassName="site-header" />

      <main>
        <section className="hero adventure-hero" id="home">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-grid container">
            <div className="hero-copy">
              <div className="eyebrow">
                <span aria-hidden="true">✦</span>
                <span className="eyebrow-cross" aria-hidden="true">✦</span> Your Namibia expedition begins here
              </div>
              <h1>
                Find your way <span>into the extraordinary.</span>
              </h1>
              <p>
                Follow your curiosity across dunes, coast, cities, and wildlife country.
                TourMate AI helps you discover Namibia and explore ideas with a demo travel assistant.
              </p>

              <div className="home-cta-row">
                <Link className="button plan-button" href="/ai-guide"><ExpeditionIcon name="spark" size={18} /> Ask your guide <span aria-hidden="true">↗</span></Link>
                <Link className="home-explore-link" href="/explore">Explore the map <span aria-hidden="true">→</span></Link>
              </div>
              <p className="adventure-truth-note"><span aria-hidden="true">◈</span> Your guide is a prewritten demo. Places and prices are sample information.</p>
            </div>

            <div className="hero-visual" aria-label="Travel illustration">
              <ExpeditionLandscape />
              <div className="expedition-map-label"><span>FIELD NOTES / NAMIBIA</span><strong>Find your next story</strong><small>20° S · 17° E</small></div>
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

        <section className="features adventure-missions" id="explore">
          <div className="container">
            <SectionHeading eyebrow="Choose your first mission" title="Make the journey yours." description="Three useful ways to begin. Pick the path that interests you." id="ai-guide" />
            <div className="feature-grid">
              {missions.map((mission) => (
                <article className="feature-card adventure-mission-card" key={mission.number}>
                  <div className="mission-card-top"><span className="mission-number">MISSION {mission.number}</span><ExpeditionIcon name={mission.icon} size={25} /></div>
                  <h3>{mission.title}</h3>
                  <p>{mission.description}</p>
                  <Link href={mission.href}>{mission.action} <span aria-hidden="true">↗</span></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="adventure-discover" aria-labelledby="discover-title"><div className="container adventure-discover-grid"><div><span className="adventure-eyebrow">A country of contrasts</span><h2 id="discover-title">Your next chapter could start anywhere.</h2><p>Browse a curated introduction to Namibia&apos;s landscapes and experiences. Save sample stays and activities when you sign in, then return to your journey hub.</p><Link className="adventure-text-link" href="/explore">See destinations <span aria-hidden="true">→</span></Link></div><div className="adventure-region-stack"><Link href="/explore"><span>01 / DESERT</span><strong>Sossusvlei</strong><small>Amber dunes and wide horizons</small></Link><Link href="/attractions"><span>02 / WILDLIFE</span><strong>Etosha</strong><small>Wildlife country and waterholes</small></Link><Link href="/explore"><span>03 / COAST</span><strong>Swakopmund</strong><small>Where the desert meets the Atlantic</small></Link></div></div></section>
      </main>

      <AdventureFooter />
    </div>
  );
}
