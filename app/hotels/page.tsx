import type { Metadata } from "next";
import Link from "next/link";
import { SiteNavigation } from "../components/site-navigation";
import HotelImage from "./hotel-image";
import { hotelProperties } from "./catalogue";
import { FavouriteButton, FavouritesProvider } from "../components/favourites";

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

const favouriteId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
      <SiteNavigation headerClassName="hotels-header" />

      <main>
        <section className="hotels-hero" aria-labelledby="hotels-title">
          <div className="container hotels-hero-content">
            <div className="eyebrow"><span aria-hidden="true">✦</span> Stay somewhere unforgettable</div>
            <h1 id="hotels-title">Find Your Perfect Stay</h1>
            <p>Browse illustrative accommodation ideas across Namibia. Listings, amenities, and prices are samples; confirm details directly with providers.</p>
            <form className="hotel-search" action="#stays" aria-label="Stay search preview">
              <fieldset className="catalogue-preview-fields" disabled>
              <div className="hotel-search-field destination-field"><label htmlFor="hotel-destination">Destination</label><input id="hotel-destination" name="destination" type="search" placeholder="City or region in Namibia" /></div>
              <div className="hotel-search-field"><label htmlFor="check-in">Check-in</label><input id="check-in" name="checkIn" type="date" /></div>
              <div className="hotel-search-field"><label htmlFor="check-out">Check-out</label><input id="check-out" name="checkOut" type="date" /></div>
              <div className="hotel-search-field"><label htmlFor="guests">Guests</label><select id="guests" name="guests" defaultValue="2"><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option><option value="5">5+ guests</option></select></div>
              <button className="button hotel-search-button" type="button" disabled title="Live stay search is not available">Search preview <span aria-hidden="true">→</span></button>
              </fieldset>
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
                <form id="hotel-filter-form" aria-label="Stay filters preview"><fieldset className="catalogue-preview-fields" disabled>
                  <div className="hotel-filter-group"><label htmlFor="price-range">Maximum price per night</label><input id="price-range" name="price" type="range" min="500" max="5000" defaultValue="3500" /><div className="range-labels"><span>N$500</span><span>N$5,000+</span></div></div>
                  <fieldset className="hotel-filter-group"><legend>Star rating</legend>{[5,4,3].map((star) => <label className="check-option" key={star}><input type="checkbox" name="stars" value={star} /><span aria-hidden="true">★</span> {star} stars</label>)}</fieldset>
                  <fieldset className="hotel-filter-group"><legend>Property type</legend>{["Hotel", "Lodge", "Guesthouse", "Apartment", "Campsite"].map((type) => <label className="check-option" key={type}><input type="checkbox" name="propertyType" value={type} />{type}</label>)}</fieldset>
                  <fieldset className="hotel-filter-group"><legend>Amenities</legend>{["Free Wi-Fi", "Pool", "Breakfast included", "Parking"].map((amenity) => <label className="check-option" key={amenity}><input type="checkbox" name="amenities" value={amenity} />{amenity}</label>)}</fieldset>
                </fieldset></form>
              </aside>

              <div className="hotel-results">
                <div className="hotel-results-heading"><div><span>Illustrative Namibia stays</span><h2 id="stay-heading">Accommodation ideas</h2><p>6 sample listings · Search and filters are previews only.</p></div></div>
                <FavouritesProvider itemType="hotel" returnPath="/hotels"><div className="hotel-grid">
                  {hotelProperties.map((property) => (
                    <article className="hotel-card" key={property.name}>
                      <FavouriteButton itemId={favouriteId(property.name)} itemName={property.name} snapshot={{ ...property }} />
                      <HotelImage src={property.image} alt={property.alt} propertyType={property.type} scene={property.scene} />
                      <div className="hotel-card-body"><div className="hotel-card-top"><p className="hotel-location">⌖ {property.location}, Namibia</p><span className="hotel-rating">Sample listing</span></div><h3>{property.name}</h3><p className="hotel-description">{property.description}</p><ul className="amenity-list" aria-label="Illustrative amenities">{property.amenities.map((amenity) => <li key={amenity}>✓ {amenity}</li>)}</ul><div className="hotel-card-footer"><p><strong>{property.price}</strong><span>illustrative nightly price</span></p><Link className="button hotel-details-button" href="/ai-guide">Ask Assistant</Link></div></div>
                    </article>
                  ))}
                </div></FavouritesProvider>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="container footer-content"><Brand /><p>Discover Namibia, one idea at a time.</p><nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/ai-guide">Assistant</Link><Link href="/partner/apply">Partners</Link></nav></div></footer>
    </div>
  );
}
