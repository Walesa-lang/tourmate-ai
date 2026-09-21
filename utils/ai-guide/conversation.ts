import type { AiGuideRequest, AiGuideServiceResponse } from "./contracts";
import { catalogueNotice, tourismRecords, type Recommendation, type TourismRecord } from "./catalogue";
import type { TravelProfile } from "@/utils/profile";

// Provider-neutral server input. Profile context is filtered by the server,
// never accepted from the browser. No provider credentials are used.
export type AssistantInput = AiGuideRequest & {
  userId?: string;
  conversationId?: string;
  permittedProfile?: Partial<TravelProfile>;
  itineraryContext?: Recommendation[];
  approvedRecords?: TourismRecord[];
};
export interface AssistantProvider { respond(input: AssistantInput): Promise<AiGuideServiceResponse> }

export function contextualReply(input: AssistantInput): AiGuideServiceResponse | undefined {
  if (input.language !== "en") return undefined;
  const userMessages = input.messages.filter((m) => m.role === "user").map((m) => m.content);
  const latest = userMessages.at(-1) ?? "";
  const history = userMessages.join(" ");
  const profile = input.permittedProfile;
  const records = input.approvedRecords ?? tourismRecords;
  const locations = [...new Set(records.map((r) => r.location))].sort((a,b) => b.length - a.length);
  const findArea = (text: string) => locations.find((area) => text.toLowerCase().includes(area.toLowerCase()) || (area === "Etosha National Park" && /etosha/i.test(text)));
  const area = [...userMessages].reverse().map(findArea).find(Boolean) ?? findArea(String(profile?.trip?.area ?? ""));
  const base = { emergency: false, grounding: "illustrative_catalogue" as const, notice: catalogueNotice, usage: { provider: "demo", model: "deterministic-v1" } };
  if (/restaurant|nightlife|entertainment|music|sport|museum|skydiving/i.test(latest)) return { ...base, grounding: "unavailable", message: "I do not have verified venue listings or current events for that request. Confirm options, hours and suitability with a local visitor centre or the provider. I can suggest activities from the illustrative catalogue." };
  if (/more detail|tell me more/i.test(latest)) return { ...base, message: `For ${area ?? "your chosen area"}, use catalogue ideas as a starting point. Ask the provider about access, transport, dates, group suitability and cancellation terms. ${profile?.preferences?.accessibility ? "Confirm your practical accessibility needs directly." : ""} ${profile?.food ? "Ask about ingredients and cross-contamination; allergy safety cannot be guaranteed." : ""}` };
  if (/weather|open now|opening hours|live|available|availability|closure|road condition|safe today|ingredients|allergen/i.test(latest)) return { ...base, grounding: "unavailable", message: "I cannot verify current prices, availability, hours, conditions or ingredients. Please confirm directly with the relevant provider before making plans." };
  if (/allerg|diet|food|restaurant|eat|meal/i.test(latest) && /allerg|diet|ingredient|religio/i.test(latest)) return { ...base, grounding: "unavailable", message: "Ask the provider about ingredients, preparation and cross-contamination. Recipes and cross-contamination can change; I cannot guarantee allergy safety. I cannot diagnose or give medical advice." };
  const planning = /route|itinerary|day plan|plan .*day|plan .*trip|\d+ days|slower|faster|relaxed|packed|remove|instead|refine/i.test(latest) || (/route|itinerary|day plan|plan .*trip|plan .*day/i.test(history) && !/hotel|restaurant|weather|transport|hello/i.test(latest));
  const hotel = /hotel|accommodation|stay|lodge/i.test(latest) || (!/attraction|activit|plan|hello/i.test(latest) && /hotel|accommodation/i.test(history));
  const attraction = /attraction|activit|hiking|culture|wildlife|museum|entertainment|nightlife|music|sport|skydiv/i.test(latest);
  if (!planning && !hotel && !attraction) return undefined;
  if (!area) return { ...base, grounding: "demo", clarification: "area", message: planning ? "I can create a demo itinerary. Which Namibia area would you like to explore?" : "I can suggest a catalogue shortlist. Which Namibia area are you considering?" };
  let choices = records.filter((r) => (r.location === area || (area.includes("Etosha") && r.location.includes("Etosha"))) && r.type === (hotel && !planning ? "hotel" : "attraction"));
  const omitted = records.filter((r) => userMessages.some((m) => /remove|exclude|without|skip/i.test(m) && (m.toLowerCase().includes(r.name.toLowerCase()) || m.toLowerCase().includes(r.category.toLowerCase()))));
  choices = choices.filter((r) => !omitted.includes(r));
  const savedInterests = profile?.interests?.selected;
  if (Array.isArray(savedInterests)) {
    choices.sort((a, b) => {
      const score = (r: TourismRecord) => savedInterests.filter((interest) => `${r.category} ${r.name}`.toLowerCase().includes(interest.toLowerCase())).length;
      return score(b) - score(a);
    });
  }
  const requestedInterest = latest.match(/\b(wildlife|culture|nature|adventure|food|hiking)\b/i)?.[1]?.toLowerCase();
  if (requestedInterest && (planning || attraction)) {
    const interestMatches = choices.filter((r) => `${r.category} ${r.name}`.toLowerCase().includes(requestedInterest));
    if (interestMatches.length) choices = interestMatches;
    else return { ...base, grounding: "unavailable", message: `The ${area} sample catalogue has no matching ${requestedInterest} activity. I cannot responsibly fill that gap. Try another interest or area, or confirm options with a local provider.` };
  }
  if (!choices.length) return { ...base, grounding: "unavailable", message: `I do not have a matching catalogue suggestion for ${area}. Try another area or ask the local provider for verified options.` };
  if (planning) {
    const durationMatch = [...userMessages].reverse().map((m) => m.match(/\b(\d{1,2})\s*days?\b/i)).find(Boolean);
    const wordDuration = /\b(one|a) day|day plan/i.test(history) ? 1 : /two day/i.test(history) ? 2 : /three day/i.test(history) ? 3 : /five day/i.test(history) ? 5 : undefined;
    let days = durationMatch ? Number(durationMatch[1]) : wordDuration;
    if (!days && profile?.trip?.arrival && profile.trip.departure) days = Math.round((Date.parse(String(profile.trip.departure)) - Date.parse(String(profile.trip.arrival))) / 86400000) + 1;
    if (!days) return { ...base, grounding: "demo", clarification: "duration", message: `For ${area}, how many days would you like to plan?` };
    if (days < 1 || days > 14) return { ...base, grounding: "demo", clarification: "duration", message: "This demo supports 1–14 days. How many days within that range would you like?" };
    const pace = [...userMessages].reverse().map((m) => /relaxed|slower/i.test(m) ? "relaxed" : /packed|faster/i.test(m) ? "packed" : /balanced/i.test(m) ? "balanced" : undefined).find(Boolean) ?? profile?.preferences?.pace ?? "balanced";
    const proposal = choices.slice(0, pace === "relaxed" ? 1 : 2).map((record, index) => ({ ...record, day: Math.min(index + 1, days!), reason: "Selected from the illustrative catalogue for this area; confirm suitability with the provider." }));
    return { ...base, itinerary: { area, days, pace: String(pace), items: proposal }, recommendations: proposal, message: `Suggested ${days}-day plan for ${area}, at a ${pace} pace. ${proposal.map((p) => `Day ${p.day}: consider ${p.name}.`).join(" ")} ${days > proposal.length ? "Leave remaining days open; the catalogue is too limited to fill them responsibly." : "Leave the rest of the day flexible."} Dates are optional for these ideas. Ask for a slower pace, another area, or to remove an activity. ${profile?.food ? "Confirm ingredients and cross-contamination directly; allergy safety cannot be guaranteed." : ""}` };
  }
  // Existing destination accommodation answers preserve their translated demo
  // price labels; add saveable records in the service boundary.
  if (hotel) {
    if (/hotel|accommodation|stay|lodge/i.test(latest)) return undefined;
    return { ...base, recommendations: choices.map((r) => ({ ...r, reason: "Sample accommodation in your requested area." })), message: `For ${area}, the demo catalogue includes ${choices.map((r) => r.name).join("; ")}. Confirm current details directly before booking.` };
  }
  return { ...base, recommendations: choices.slice(0, 3).map((r) => ({ ...r, reason: "Catalogue suggestion for your requested area." })), message: `${area} catalogue shortlist: ${choices.slice(0, 3).map((r) => r.name).join("; ")}. Ask for a day plan to organise these ideas.` };
}
