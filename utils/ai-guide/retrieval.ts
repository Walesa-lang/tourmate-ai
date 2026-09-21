import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/database.types";
import type { AssistantInput } from "./conversation";
import { tourismRecords, type TourismRecord } from "./catalogue";

export type Source = { id: string; kind: "approved_record" | "illustrative_catalogue"; label: string; url?: string; verifiedAt?: string };
export type Retrieved = { records: TourismRecord[]; sources: Source[]; state: "approved_records" | "illustrative_catalogue" | "unavailable" };

export function relevantArea(input: AssistantInput) {
  const areas = [...new Set(tourismRecords.map((r) => r.location))].sort((a, b) => b.length - a.length);
  const find = (text: string) => areas.find((a) => text.toLowerCase().includes(a.toLowerCase()) || (a.includes("Etosha") && /etosha/i.test(text)));
  return [...input.messages].reverse().filter((m) => m.role === "user").map((m) => find(m.content)).find(Boolean) ?? find(String(input.permittedProfile?.trip?.area ?? ""));
}

export function sampleRetrieval(input: AssistantInput): Retrieved {
  const area = relevantArea(input);
  const records = tourismRecords.filter((r) => !area || r.location === area || (area.includes("Etosha") && r.location.includes("Etosha"))).slice(0, 8);
  return { records, sources: records.map((r) => ({ id: r.id, kind: "illustrative_catalogue", label: "TourMate illustrative Namibia catalogue" })), state: "illustrative_catalogue" };
}

// Public approved content only; never query partner applications or private
// profiles as tourism knowledge. No free-form query is interpolated into SQL.
export async function retrieve(input: AssistantInput, db: SupabaseClient<Database>, signal: AbortSignal): Promise<Retrieved> {
  const area = relevantArea(input);
  if (!area) return { records: [], sources: [], state: "unavailable" };
  const { data, error } = await db.from("tourism_content").select("id,item_type,name,location,category,source_label,source_url,verified_at")
    .eq("country_code", "NA").eq("approved", true).eq("location", area)
    .order("id").limit(8).abortSignal(signal);
  if (error || !data?.length) return { records: [], sources: [], state: "unavailable" };
  return {
    records: data.map((r) => ({ id: r.id, type: r.item_type, name: r.name, location: r.location, category: r.category })),
    sources: data.map((r) => ({ id: r.id, kind: "approved_record", label: r.source_label, url: r.source_url, verifiedAt: r.verified_at })),
    state: "approved_records",
  };
}
