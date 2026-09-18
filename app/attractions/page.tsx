import type { Metadata } from "next";
import Link from "next/link";
import { SiteNavigation } from "../components/site-navigation";
import { FavouriteButton, FavouritesProvider } from "../components/favourites";
import AttractionImage from "./attraction-image";

export const metadata: Metadata = {
  title: "Attractions & Activities in Namibia | TourMate AI",
  description: "Discover sample safaris, adventures, cultural experiences, and natural wonders across Namibia.",
};

const categories = [
  ["Wildlife and Safaris", "WS"], ["Adventure", "AD"], ["Culture and Heritage", "CH"],
  ["Nature", "NA"], ["Food and Local Experiences", "FL"], ["Family Activities", "FA"],
];

const experiences = [
  { name: "Etosha Wildlife Safari", location: "Etosha National Park", category: "Wildlife and Safaris", rating: "4.9", reviews: 328, duration: "Full day", price: "N$1,950", scene: "savanna", image: "https://images.unsplash.com/photo-1516426122078-c23e76319801", alt: "Elephants walking across an open African savanna", description: "Track elephants, lions, giraffes, and antelope around Etosha's celebrated waterholes with a local guide." },
  { name: "Sossusvlei Sunrise Dune Walk", location: "Sossusvlei", category: "Nature", rating: "4.8", reviews: 241, duration: "5 hours", price: "N$1,250", scene: "dunes", image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35", alt: "Towering orange sand dunes beneath a clear desert sky", description: "Climb glowing dunes at first light and explore the dramatic clay pan landscapes of the Namib Desert." },
  { name: "Coastal Sandboarding Adventure", location: "Swakopmund", category: "Adventure", rating: "4.7", reviews: 186, duration: "3 hours", price: "N$850", scene: "coast", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee", alt: "Traveller overlooking a broad sunlit desert landscape", description: "Ride Namibia's coastal dunes with friendly instruction, safety equipment, and spectacular Atlantic views." },
  { name: "Pelican Point Kayak Tour", location: "Walvis Bay", category: "Family Activities", rating: "4.9", reviews: 214, duration: "4 hours", price: "N$1,100", scene: "lagoon", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5", alt: "Kayaker paddling across calm blue water surrounded by nature", description: "Paddle the sheltered lagoon near seals and seabirds on a relaxed, family-friendly coastal outing." },
  { name: "Windhoek Flavours & Stories", location: "Windhoek", category: "Food and Local Experiences", rating: "4.6", reviews: 97, duration: "3.5 hours", price: "N$780", scene: "city", image: "https://images.unsplash.com/photo-1533669955142-6a73332af4db", alt: "Colourful local dishes arranged for a shared dining experience", description: "Taste contemporary Namibian flavours while hearing the stories behind the capital's neighbourhoods." },
  { name: "Fish River Canyon Rim Hike", location: "Fish River Canyon", category: "Adventure", rating: "4.8", reviews: 153, duration: "6 hours", price: "N$1,400", scene: "canyon", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", alt: "Hiker looking across a vast rocky canyon under blue sky", description: "Follow a scenic canyon-rim route with geological insights and sweeping views of Namibia's south." },
  { name: "Skeleton Coast Discovery Drive", location: "Skeleton Coast", category: "Nature", rating: "4.7", reviews: 122, duration: "Full day", price: "N$2,200", scene: "skeleton", image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5", alt: "Remote windswept coastline with waves meeting a broad sandy shore", description: "Journey through misty coastal wilderness, shifting dunes, and remote viewpoints with an expert guide." },
  { name: "Twyfelfontein Rock Art Walk", location: "Twyfelfontein", category: "Culture and Heritage", rating: "4.8", reviews: 175, duration: "2.5 hours", price: "N$620", scene: "rock", image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429", alt: "Ancient red rock formations glowing in warm desert light", description: "Explore a remarkable cultural landscape and learn about the meaning and history of ancient engravings." },
];

const favouriteId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Brand() {
  return <Link className="brand" href="/" aria-label="TourMate AI home"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10.5" /><path d="M3.5 14h21M14 3.5c3 3.2 4.5 6.7 4.5 10.5S17 21.3 14 24.5c-3-3.2-4.5-6.7-4.5-10.5S11 6.7 14 3.5Z" /><path d="m17.8 7.7-2.3 5.8-5.8 2.3 2.3-5.8 5.8-2.3Z" /></svg></span><span>TourMate <strong>AI</strong></span></Link>;
}

export default function AttractionsPage() {
  return (
    <div className="site-shell attractions-page">
      <SiteNavigation headerClassName="attractions-header" />
      <main>
        <section className="attractions-hero" aria-labelledby="attractions-title">
          <div className="container attractions-hero-content">
            <div className="eyebrow"><span aria-hidden="true">✦</span> Make every moment count</div>
            <h1 id="attractions-title">Discover Unforgettable Experiences</h1>
            <p>Find ideas for Namibia activities and natural wonders. These are sample experiences, not bookable tours; confirm prices and details with providers.</p>
            <form className="attraction-search" action="#experiences" aria-label="Activity search preview"><fieldset className="catalogue-preview-fields" disabled>
              <div className="attraction-search-field attraction-destination-field"><label htmlFor="activity-destination">Destination</label><input id="activity-destination" name="destination" type="search" placeholder="Where in Namibia?" /></div>
              <div className="attraction-search-field"><label htmlFor="activity-date">Experience date</label><input id="activity-date" name="date" type="date" /></div>
              <div className="attraction-search-field"><label htmlFor="travellers">Travellers</label><select id="travellers" name="travellers" defaultValue="2"><option value="1">1 traveller</option><option value="2">2 travellers</option><option value="3">3 travellers</option><option value="4">4 travellers</option><option value="5">5+ travellers</option></select></div>
              <button className="button attraction-search-button" type="button" disabled title="Live experience search is not available">Search preview <span aria-hidden="true">→</span></button>
            </fieldset></form>
          </div>
        </section>
        <section className="attractions-content" id="experiences" aria-labelledby="experience-heading">
          <div className="container">
            <div className="activity-categories" aria-label="Activity categories">{categories.map(([name, icon]) => <a href="#experience-heading" className="activity-category" key={name}><span aria-hidden="true">{icon}</span>{name}</a>)}</div>
            <form className="attraction-filter-panel" aria-label="Activity filters preview"><fieldset className="catalogue-preview-fields" disabled>
              <div className="attraction-filter-field"><label htmlFor="filter-destination">Destination</label><select id="filter-destination" defaultValue=""><option value="">All destinations</option>{experiences.map((item) => <option key={item.location}>{item.location}</option>)}</select></div>
              <div className="attraction-filter-field"><label htmlFor="filter-category">Activity category</label><select id="filter-category" defaultValue=""><option value="">All categories</option>{categories.map(([name]) => <option key={name}>{name}</option>)}</select></div>
              <div className="attraction-filter-field"><label htmlFor="filter-price">Price range</label><select id="filter-price" defaultValue=""><option value="">Any price</option><option>Under N$1,000</option><option>N$1,000–N$2,000</option><option>Above N$2,000</option></select></div>
              <div className="attraction-filter-field"><label htmlFor="filter-duration">Duration</label><select id="filter-duration" defaultValue=""><option value="">Any duration</option><option>Up to 3 hours</option><option>Half day</option><option>Full day</option></select></div>
              <div className="attraction-filter-field"><label htmlFor="filter-rating">Minimum rating</label><select id="filter-rating" defaultValue=""><option value="">Any rating</option><option value="4.5">4.5+ stars</option><option value="4.7">4.7+ stars</option><option value="4.9">4.9 stars</option></select></div>
              <div className="attraction-filter-field"><label htmlFor="activity-sort">Sort by</label><select id="activity-sort" defaultValue="popularity"><option value="popularity">Popularity</option><option value="rating">Highest rating</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></div>
            </fieldset></form>
            <div className="attraction-results-heading"><div><span>Illustrative ideas · Filters are previews only</span><h2 id="experience-heading">Namibia experiences</h2></div><p>8 sample activities</p></div>
            <FavouritesProvider itemType="attraction" returnPath="/attractions">
              <div className="attraction-grid">
                {experiences.map((experience) => (
                  <article className="attraction-card" key={experience.name}>
                    <FavouriteButton itemId={favouriteId(experience.name)} itemName={experience.name} snapshot={{ ...experience }} />
                    <AttractionImage src={experience.image} alt={experience.alt} scene={experience.scene} />
                    <div className="attraction-card-body">
                      <div className="attraction-card-meta"><span className="attraction-category-tag">{experience.category}</span><span className="attraction-rating">Sample activity</span></div>
                      <h3>{experience.name}</h3><p className="attraction-location">⌖ {experience.location}, Namibia</p><p className="attraction-description">{experience.description}</p>
                      <div className="attraction-details"><span><strong>Illustrative duration</strong>{experience.duration}</span><span><strong>Illustrative price</strong>{experience.price} <small>per person</small></span></div>
                      <Link className="button attraction-view-button" href="/ai-guide">Ask Assistant <span aria-hidden="true">→</span></Link>
                    </div>
                  </article>
                ))}
              </div>
            </FavouritesProvider>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="container footer-content"><Brand /><p>Discover Namibia, one idea at a time.</p><nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/ai-guide">Assistant</Link><Link href="/partner/apply">Partners</Link></nav></div></footer>
    </div>
  );
}
