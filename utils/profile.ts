import { languages } from "@/app/i18n/translations";

export const stages = ["account", "trip", "interests", "preferences", "food"] as const;
export type Stage = typeof stages[number];
export const purposes = ["personalisation", "food", "location", "safety"] as const;
export type Purpose = typeof purposes[number];
export const consentWording: Record<Purpose, string> = {
  personalisation: "Use my saved travel profile to personalise Assistant suggestions.",
  food: "Store my optional food preferences and use them to suggest questions to ask providers. This cannot guarantee allergy safety.",
  location: "Location use is not active. No device location is requested or tracked.",
  safety: "Trusted-contact and safety use is not active. No contacts are collected and no assistance is dispatched.",
};
export const interests = ["Nature", "Wildlife", "Culture", "Museums", "Food", "Nightlife", "Music", "Sport", "Hiking", "Skydiving", "Adventure", "Relaxation", "Business"];
export type Field = { key: string; label: string; options?: readonly string[]; type?: string; max?: number; autocomplete?: string };
export const fields: Record<Stage, Field[]> = {
  account: [{ key: "language", label: "Preferred language", options: languages }],
  trip: [
    { key: "arrival", label: "Arrival date (optional)", type: "date" },
    { key: "departure", label: "Departure date (optional)", type: "date" },
    { key: "dates", label: "Date flexibility", options: ["unknown", "flexible", "fixed"] },
    { key: "area", label: "Current or planned Namibia area", max: 120 },
    { key: "origin", label: "Country of origin", max: 120, autocomplete: "country-name" },
    { key: "travellers", label: "Number of travellers", type: "number" },
    { key: "party", label: "Travelling party", options: ["solo", "couple", "family", "friends", "business", "group"] },
  ],
  interests: [{ key: "custom", label: "Other interests (optional)", max: 300 }],
  preferences: [
    { key: "budget", label: "Budget category", options: ["budget", "comfort", "luxury"] },
    { key: "pace", label: "Travel pace", options: ["relaxed", "balanced", "packed"] },
    { key: "accommodation", label: "Accommodation preference", options: ["hotel", "guesthouse", "lodge", "camping", "apartment"] },
    { key: "transport", label: "Transport preference", options: ["rental car", "guided tour", "transfer", "public transport"] },
    { key: "accessibility", label: "Accessibility preferences (optional; describe practical needs only)", max: 300 },
  ],
  food: [
    { key: "allergies", label: "Allergies (optional)", max: 300 },
    { key: "diet", label: "Dietary restrictions (optional)", max: 300 },
    { key: "religiousFood", label: "Religious food preferences (optional)", max: 300 },
  ],
};
export type StepData = Record<string, string | string[]>;
export type Consent = { status: "granted" | "withdrawn"; version: string; granted_at: string | null; withdrawn_at: string | null; updated_at: string; source: string };
export type TravelProfile = Partial<Record<Stage, StepData>> & { completed?: Stage[]; consents?: Partial<Record<Purpose, Consent>> };

export function validateStep(stage: Stage, value: unknown): { data: StepData; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const data: StepData = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return { data, errors: { form: "Enter valid profile information." } };
  const input = value as Record<string, unknown>;
  for (const field of fields[stage]) {
    const raw = input[field.key] ?? "";
    if (typeof raw !== "string") { errors[field.key] = "Enter a valid value."; continue; }
    const text = raw.trim();
    if (text.length > (field.max ?? 120)) errors[field.key] = "This answer is too long.";
    if (text && field.options && !field.options.includes(text)) errors[field.key] = "Choose one of the listed options.";
    if (text && field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text || text < "2000-01-01" || text > "2100-12-31")) errors[field.key] = "Enter a valid date between 2000 and 2100.";
    if (text && field.type === "number" && (!/^\d+$/.test(text) || +text < 1 || +text > 100)) errors[field.key] = "Enter a whole number from 1 to 100.";
    if (text) data[field.key] = text;
  }
  if (stage === "trip" && data.arrival && data.departure && data.departure < data.arrival) errors.departure = "Departure must be on or after arrival.";
  if (stage === "interests") {
    const selected = input.selected ?? [];
    if (!Array.isArray(selected) || selected.length > interests.length || selected.some((v) => typeof v !== "string" || !interests.includes(v))) errors.selected = "Choose listed interests.";
    else data.selected = [...new Set(selected)] as string[];
  }
  const allowed = new Set([...fields[stage].map((f) => f.key), ...(stage === "interests" ? ["selected"] : [])]);
  if (Object.keys(input).some((k) => !allowed.has(k))) errors.form = "Unexpected profile field.";
  return { data, errors };
}

export function permittedContext(profile: TravelProfile): Partial<TravelProfile> {
  const result: Partial<TravelProfile> = {};
  if (profile.consents?.personalisation?.status === "granted") {
    result.trip = profile.trip;
    result.interests = profile.interests;
    result.preferences = profile.preferences;
  }
  if (profile.consents?.food?.status === "granted") result.food = profile.food;
  return result;
}
