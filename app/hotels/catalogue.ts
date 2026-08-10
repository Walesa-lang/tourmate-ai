export type HotelProperty = {
  name: string;
  location: string;
  rating: string;
  price: string;
  type: string;
  scene: string;
  image: string;
  alt: string;
  description: string;
  amenities: string[];
};

export const hotelProperties: HotelProperty[] = [
  { name: "Windhoek Garden Hotel", location: "Windhoek", rating: "4.8", price: "N$1,850", type: "Hotel", scene: "windhoek", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945", alt: "Sunlit resort pool surrounded by palms and modern accommodation", description: "A calm city retreat with leafy courtyards, modern rooms, and easy access to central Windhoek.", amenities: ["Breakfast", "Pool", "Wi-Fi"] },
  { name: "Atlantic Breeze Guesthouse", location: "Swakopmund", rating: "4.7", price: "N$1,420", type: "Guesthouse", scene: "swakopmund", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa", alt: "Bright guest accommodation overlooking a landscaped swimming pool", description: "Relaxed coastal hospitality a short walk from the beach and Swakopmund's historic centre.", amenities: ["Ocean view", "Parking", "Wi-Fi"] },
  { name: "Lagoon View Apartments", location: "Walvis Bay", rating: "4.6", price: "N$1,600", type: "Apartment", scene: "walvis", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4", alt: "Coastal accommodation with an infinity pool facing the ocean", description: "Spacious self-catering apartments overlooking the lagoon, ideal for couples and families.", amenities: ["Kitchen", "Balcony", "Parking"] },
  { name: "Etosha Safari Lodge", location: "Etosha", rating: "4.9", price: "N$3,250", type: "Lodge", scene: "etosha", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb", alt: "Warmly lit lodge exterior surrounded by tropical landscaping", description: "A welcoming safari base with sunset views, guided game drives, and warm Namibian cuisine.", amenities: ["Game drives", "Pool", "Restaurant"] },
  { name: "Sossus Dune Camp", location: "Sossusvlei", rating: "4.8", price: "N$2,780", type: "Campsite", scene: "sossusvlei", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4", alt: "Tent pitched in a scenic landscape beneath an open sky", description: "Comfortable desert camping beneath star-filled skies near the iconic dunes of Sossusvlei.", amenities: ["Firepit", "Showers", "Guided tours"] },
  { name: "Desert Quiver Lodge", location: "Sossusvlei", rating: "4.7", price: "N$2,450", type: "Lodge", scene: "desert", image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2", alt: "Secluded holiday lodge and pool set in a rugged landscape", description: "Private chalets set against granite outcrops, with sweeping desert views and quiet evenings.", amenities: ["Air conditioning", "Pool", "Braai area"] },
];
