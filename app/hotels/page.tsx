import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hotels & Accommodation in Namibia | TourMate AI",
  description:
    "Explore hotels, lodges, guesthouses, apartments, and campsites across Namibia.",
};

const categories = [
  { name: "Hotels", icon: "H" },
  { name: "Lodges", icon: "L" },
  { name: "Guesthouses", icon: "G" },
  { name: "Apartments", icon: "A" },
  { name: "Campsites", icon: "C" },
];

const properties = [
  { name: "Windhoek Garden Hotel", location: "Windhoek", rating: "4.8", price: "N$1,850", type: "Hotel", scene: "windhoek", description: "A calm city retreat with leafy courtyards, modern rooms, and easy access to central Windhoek.", amenities: ["Breakfast", "Pool", "Wi-Fi"] },
  { name: "Atlantic Breeze Guesthouse", location: "Swakopmund", rating: "4.7", price: "N$1,420", type: "Guesthouse", scene: "swakopmund", description: "Relaxed coastal hospitality a short walk from the beach and Swakopmund's historic centre.", amenities: ["Ocean view", "Parking", "Wi-Fi"] },
  { name: "Lagoon View Apartments", location: "Walvis Bay", rating: "4.6", price: "N$1,600", type: "Apartment", scene: "walvis", description: "Spacious self-catering apartments overlooking the lagoon, ideal for couples and families.", amenities: ["Kitchen", "Balcony", "Parking"] },
  { name: "Etosha Safari Lodge", location: "Etosha", rating: "4.9", price: "N$3,250", type: "Lodge", scene: "etosha", description: "A welcoming safari base with sunset views, guided game drives, and warm Namibian cuisine.", amenities: ["Game drives", "Pool", "Restaurant"] },
  { name: "Sossus Dune Camp", location: "Sossusvlei", rating: "4.8", price: "N$2,780", type: "Campsite", scene: "sossusvlei", description: "Comfortable desert camping beneath star-filled skies near the iconic dunes of Sossusvlei.", amenities: ["Firepit", "Showers", "Guided tours"] },
  { name: "Desert Quiver Lodge", location: "Sossusvlei", rating: "4.7", price: "N$2,450", type: "Lodge", scene: "desert", description: "Private chalets set against granite outcrops, with sweeping desert views and quiet evenings.", amenities: ["Air conditioning", "Pool", "Braai area"] },
];

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="TourMate AI home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10.5" /><path d="M3.5 14h21M14 3.5c3 3.2 4.5 6.7 4.5 10.5S17 21.3 14 24.5c-3-3.2-4.5-6.7-4.5-10.5S11 6.7 14 3.5Z" /><path d="m17.8 7.7-2.3 5.8-5.8 2.3 2.3-5.8 5.8-2.3Z" /></svg>
      </span>
      <span>TourMate <strong>AI</strong></span>
    </Link>
  );
}

export default function HotelsPage() {
  return (
    <div className="site-shell hotels-page">
      <header className="hotels-header">
        <nav className="nav container" aria-label="Main navigation">
          <Brand />
          <div className="nav-links">
            <Link href="/">Home</Link><Link href="/explore">Explore</Link><Link href="/ai-guide">AI Guide</Link>
            <Link className="active" href="/hotels" aria-current="page">Hotels</Link><Link href="/trip-planner">Trip Planner</Link>
          </div>
          <div className="nav-actions"><Link className="sign-in" href="/#footer">Sign In</Link><Link className="button button-small" href="/trip-planner">Plan a Trip <span aria-hidden="true">→</span></Link></div>
        </nav>
      </header>

      <main>
        <section className="hotels-hero" aria-labelledby="hotels-title">
          <div className="container hotels-hero-content">
            <div className="eyebrow"><span aria-hidden="true">✦</span> Stay somewhere unforgettable</div>
            <h1 id="hotels-title">Find Your Perfect Stay</h1>
            <p>Discover welcoming places to stay across Namibia, from vibrant cities to quiet desert landscapes.</p>
            <form className="hotel-search" action="#stays">
              <div className="hotel-search-field destination-field"><label htmlFor="hotel-destination">Destination</label><input id="hotel-destination" name="destination" type="search" placeholder="City or region in Namibia" /></div>
              <div className="hotel-search-field"><label htmlFor="check-in">Check-in</label><input id="check-in" name="checkIn" type="date" /></div>
              <div className="hotel-search-field"><label htmlFor="check-out">Check-out</label><input id="check-out" name="checkOut" type="date" /></div>
              <div className="hotel-search-field"><label htmlFor="guests">Guests</label><select id="guests" name="guests" defaultValue="2"><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option><option value="5">5+ guests</option></select></div>
              <button className="button hotel-search-button" type="submit">Search stays <span aria-hidden="true">→</span></button>
            </form>
          </div>
        </section>

        <section className="hotel-content" id="stays" aria-labelledby="stay-heading">
          <div className="container">
            <div className="category-strip" aria-label="Accommodation categories">
              {categories.map((category) => <a href="#stay-heading" className="hotel-category" key={category.name}><span aria-hidden="true">{category.icon}</span>{category.name}</a>)}
            </div>
            <div className="hotel-layout">
              <aside className="hotel-filters" aria-labelledby="filter-heading">
                <div className="filter-title"><div><span>Refine your stay</span><h2 id="filter-heading">Filters</h2></div><button type="reset" form="hotel-filter-form">Reset</button></div>
                <form id="hotel-filter-form">
                  <div className="hotel-filter-group"><label htmlFor="price-range">Maximum price per night</label><input id="price-range" name="price" type="range" min="500" max="5000" defaultValue="3500" /><div className="range-labels"><span>N$500</span><span>N$5,000+</span></div></div>
                  <fieldset className="hotel-filter-group"><legend>Star rating</legend>{[5,4,3].map((star) => <label className="check-option" key={star}><input type="checkbox" name="stars" value={star} /><span aria-hidden="true">★</span> {star} stars</label>)}</fieldset>
                  <fieldset className="hotel-filter-group"><legend>Property type</legend>{["Hotel", "Lodge", "Guesthouse", "Apartment", "Campsite"].map((type) => <label className="check-option" key={type}><input type="checkbox" name="propertyType" value={type} />{type}</label>)}</fieldset>
                  <fieldset className="hotel-filter-group"><legend>Amenities</legend>{["Free Wi-Fi", "Pool", "Breakfast included", "Parking"].map((amenity) => <label className="check-option" key={amenity}><input type="checkbox" name="amenities" value={amenity} />{amenity}</label>)}</fieldset>
                </form>
              </aside>

              <div className="hotel-results">
                <div className="hotel-results-heading"><div><span>Handpicked in Namibia</span><h2 id="stay-heading">Places you&apos;ll love</h2><p>6 properties found</p></div><label htmlFor="sort-stays">Sort by<select id="sort-stays" name="sort" defaultValue="recommended"><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Highest rating</option></select></label></div>
                <div className="hotel-grid">
                  {properties.map((property) => (
                    <article className="hotel-card" key={property.name}>
                      <div className={`hotel-image hotel-scene-${property.scene}`} role="img" aria-label={`Scenic placeholder for ${property.name}`}><span className="property-type">{property.type}</span><span className="hotel-sun" /><span className="hotel-landscape" /></div>
                      <div className="hotel-card-body"><div className="hotel-card-top"><p className="hotel-location">⌖ {property.location}, Namibia</p><span className="hotel-rating" aria-label={`${property.rating} out of 5 stars`}>★ {property.rating}</span></div><h3>{property.name}</h3><p className="hotel-description">{property.description}</p><ul className="amenity-list" aria-label="Amenities">{property.amenities.map((amenity) => <li key={amenity}>✓ {amenity}</li>)}</ul><div className="hotel-card-footer"><p><strong>{property.price}</strong><span>per night</span></p><a className="button hotel-details-button" href="#hotel-destination">View Details</a></div></div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="container footer-content"><Brand /><p>Explore the world with confidence.</p><nav aria-label="Footer navigation"><a href="#stays">Privacy</a><a href="#stays">Terms</a><a href="#stays">Contact</a></nav></div></footer>
    </div>
  );
}
