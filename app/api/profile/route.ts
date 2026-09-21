import { createClient } from "@/utils/supabase/server";
import type { Json } from "@/utils/supabase/database.types";
import { boundedJson, checkOrigin, RequestError, safeFailure } from "@/utils/http";
import { stages, purposes, validateStep, type Stage, type Purpose } from "@/utils/profile";

export async function GET() {
  try {
    const db = await createClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) throw new RequestError(401, "Sign in to manage your profile.");
    const { data, error } = await db.from("profiles").select("full_name, travel_profile").eq("id", user.id).single();
    if (error) throw error;
    return Response.json({ ...data, email: user.email }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return safeFailure(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await boundedJson(request) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new RequestError(400, "Enter a valid request.");
    const { action } = body;
    let payload: Json = {};
    if (action === "step") {
      if (!stages.includes(body.stage as Stage)) throw new RequestError(400, "Choose a valid profile stage.");
      const validation = validateStep(body.stage as Stage, body.data);
      if (Object.keys(validation.errors).length) return Response.json({ error: "Review the highlighted fields.", errors: validation.errors }, { status: 400 });
      if (body.stage === "account" && (typeof body.full_name !== "string" || body.full_name.trim().length > 200)) throw new RequestError(400, "Enter a display name of up to 200 characters.");
      payload = { stage: body.stage as Stage, data: validation.data, ...(body.stage === "account" ? { full_name: (body.full_name as string).trim() } : {}) };
    } else if (action === "consent") {
      if (!purposes.includes(body.purpose as Purpose) || typeof body.granted !== "boolean" || (body.granted && (body.purpose === "location" || body.purpose === "safety"))) throw new RequestError(400, "Choose an available consent purpose.");
      payload = { purpose: body.purpose as Purpose, granted: body.granted };
    } else if (action === "skip" || action === "delete") {
      if (!stages.includes(body.stage as Stage) || body.stage === "account") throw new RequestError(400, "Choose an optional stage.");
      payload = { stage: body.stage as Stage };
    } else throw new RequestError(400, "Choose a valid profile action.");
    const db = await createClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) throw new RequestError(401, "Sign in to manage your profile.");
    const { data, error } = await db.rpc("update_travel_profile", { p_action: action, p_payload: payload });
    if (error) throw error;
    return Response.json({ travel_profile: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return safeFailure(error); }
}
