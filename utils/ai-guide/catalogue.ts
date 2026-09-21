import { hotelProperties } from "@/app/hotels/catalogue";
import { experiences } from "@/app/attractions/catalogue";

export const itemId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const tourismRecords = [
  ...hotelProperties.map((p) => ({ id: itemId(p.name), type: "hotel" as const, name: p.name, location: p.location, category: p.type })),
  ...experiences.map((p) => ({ id: itemId(p.name), type: "attraction" as const, name: p.name, location: p.location, category: p.category })),
];
export type TourismRecord = typeof tourismRecords[number];
export type Recommendation = TourismRecord & { reason: string; day?: number };
export const catalogueNotice = "Illustrative catalogue suggestion, not a booking or verified live listing. Confirm availability, prices, opening hours, access and transport directly with the provider.";
