import { createClient } from "@/utils/supabase/server";
import { boundedJson, checkOrigin, RequestError, safeFailure } from "@/utils/http";
import { tourismRecords, catalogueNotice } from "@/utils/ai-guide/catalogue";
import { recordSavedAction } from "@/utils/ai-guide/operations";

export async function GET() {
  try {
    const db = await createClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) throw new RequestError(401, "Sign in to view saved places.");
    const { data, error } = await db.from("favourites").select("item_type,item_id,item_snapshot").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return Response.json({ items: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return safeFailure(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await boundedJson(request, 2048) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body) || !["save", "remove"].includes(String(body.action)) || typeof body.id !== "string" || body.id.length > 200 || !["hotel", "attraction"].includes(String(body.type))) throw new RequestError(400, "Choose a valid catalogue item.");
    let item = tourismRecords.find((r) => r.id === body.id && r.type === body.type);
    if (body.day !== undefined && (!Number.isInteger(body.day) || Number(body.day) < 1 || Number(body.day) > 14)) throw new RequestError(400, "Choose a day from 1 to 14.");
    const db = await createClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) throw new RequestError(401, "Sign in to save places.");
    if (body.action === "save") {
      const { data, error } = await db.from("tourism_content").select("id,item_type,name,location,category").eq("id", body.id).eq("item_type", body.type as "hotel" | "attraction").eq("approved", true).single();
      if (!error && data && data.id === body.id && data.item_type === body.type) item = { id: data.id, type: data.item_type, name: data.name, location: data.location, category: data.category };
    }
    if (!item && body.action === "save") throw new RequestError(400, "This catalogue item is unavailable.");
    const result = body.action === "save"
      ? await db.from("favourites").upsert({ user_id: user.id, item_id: item!.id, item_type: item!.type, item_snapshot: { name: item!.name, location: item!.location, category: item!.category, reason: body.day ? "Selected from an Assistant itinerary proposal." : "Selected from an Assistant catalogue recommendation.", ...(body.day ? { day: Number(body.day) } : {}), notice: catalogueNotice } }, { onConflict: "user_id,item_type,item_id", ignoreDuplicates: true })
      : await db.from("favourites").delete().eq("user_id", user.id).eq("item_type", body.type as "hotel" | "attraction").eq("item_id", body.id);
    if (result.error) throw result.error;
    recordSavedAction(user.id, body.action as "save" | "remove", Boolean(body.day));
    return Response.json({ status: body.action === "save" ? "saved" : "removed" });
  } catch (error) { return safeFailure(error); }
}
