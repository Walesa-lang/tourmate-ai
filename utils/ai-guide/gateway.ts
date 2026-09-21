import "server-only";
import { createClient } from "@/utils/supabase/server";
import { permittedContext, type TravelProfile } from "@/utils/profile";
import { RequestError } from "@/utils/http";
import { gatewayConfig } from "./config";
import { GatewayFailure, selectProvider, validateReply, withDeadline } from "./provider";
import { retrieve, sampleRetrieval } from "./retrieval";
import type { AiGuideRequest } from "./contracts";
import type { AssistantInput } from "./conversation";

export async function respondWithContext(input: AiGuideRequest, request: Request) {
  const config = gatewayConfig();
  const context: AssistantInput = { ...input };
  let client: Awaited<ReturnType<typeof createClient>> | undefined;
  if (request.headers.has("cookie")) {
    try {
      const db = client = await createClient();
      const { data: { user }, error } = await withDeadline(() => db.auth.getUser(), config.timeoutMs, request.signal);
      if (user && !error && !user.is_anonymous) {
        context.userId = user.id;
        const { data, error } = await withDeadline(async () => await db.from("profiles").select("travel_profile").eq("id", user.id).single(), config.timeoutMs, request.signal);
        const latest = input.messages.at(-1)?.content ?? "";
        const needsProfile = !/^(hi|hello|hey|thanks|thank you)[!.\s]*$/i.test(latest) && /plan|trip|day|hotel|stay|lodge|activity|attraction|pace|recommend/i.test(input.messages.filter((m) => m.role === "user").map((m) => m.content).join(" "));
        if (!error && data && needsProfile) {
          const permitted = permittedContext(data.travel_profile as TravelProfile);
          // No food, origin, contact details, free-text interests/accessibility,
          // health or consent records are passed across the provider boundary.
          context.permittedProfile = {
            trip: permitted.trip ? Object.fromEntries(Object.entries(permitted.trip).filter(([key]) => ["area", "arrival", "departure", "travellers", "party"].includes(key))) : undefined,
            interests: permitted.interests?.selected ? { selected: permitted.interests.selected } : undefined,
            preferences: permitted.preferences ? Object.fromEntries(Object.entries(permitted.preferences).filter(([key]) => ["pace", "budget", "accommodation", "transport"].includes(key))) : undefined,
          };
        }
      }
    } catch {
      // Fail closed on personalisation; the public demo remains available.
    }
  }
  if (request.signal.aborted) throw new GatewayFailure("cancelled");
  if (config.pilot && !context.userId) throw new RequestError(401, "Sign in to use the controlled Assistant pilot.");
  let retrieval = sampleRetrieval(context);
  let missingApproved = false;
  if (config.pilot && client) {
    const approved = await withDeadline((signal) => retrieve(context, client!, signal), config.timeoutMs, request.signal);
    if (approved.records.length) retrieval = approved;
    else missingApproved = true;
  }
  context.approvedRecords = retrieval.records;
  const selected = selectProvider(config);
  // Identity is needed for authorization/accounting, never for generation.
  const providerInput: AssistantInput = { language: context.language, messages: context.messages, permittedProfile: context.permittedProfile, approvedRecords: context.approvedRecords };
  const raw = await withDeadline((signal) => selected.provider.respond(providerInput, signal), config.timeoutMs, request.signal);
  const result = validateReply(raw, context);
  result.mode = "demonstration";
  result.usage = { provider: "demo", model: "deterministic-v1", retrievalCount: retrieval.records.length };
  result.sources = retrieval.sources.filter((source) => result.recommendations?.some((r) => r.id === source.id));
  if (retrieval.state === "approved_records" && result.recommendations?.length) {
    result.grounding = "approved_records";
    result.mode = "database";
    result.notice = "Database-backed suggestion using approved source records. Current prices, availability, hours, routes and suitability are not verified; confirm with the provider.";
    for (const items of [result.recommendations, result.itinerary?.items]) for (const item of items ?? []) item.reason = "Selected from approved Namibia records; confirm current details and suitability with the provider.";
  }
  if (result.grounding === "unavailable") result.mode = "unavailable";
  if (missingApproved) result.notice = `Verified content is unavailable for this request. Showing an illustrative demonstration. ${result.notice ?? ""}`;
  if (selected.blocked) result.notice = `Live AI is unavailable; this is a deterministic demonstration. ${result.notice ?? ""}`;
  return result;
}
