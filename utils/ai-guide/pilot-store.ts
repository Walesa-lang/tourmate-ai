import "server-only";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { AssistantUsage, Database } from "@/utils/supabase/database.types";
import type { GatewayConfig } from "./config";
import { RequestError } from "@/utils/http";
import { createClient as sessionClient } from "@/utils/supabase/server";
import { gatewayConfig } from "./config";
import { withDeadline } from "./provider";
import type { AiGuideSuccessResponse } from "./contracts";

export function pilotStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new RequestError(503, "The controlled pilot is unavailable. Please try again later.");
  // A privileged writer is required to keep usage/costs and quota counters
  // unforgeable by browser clients. No user content is read with this client.
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function networkHash(request: Request) {
  const secret = process.env.ASSISTANT_NETWORK_SECRET;
  if (!secret || secret.length < 32) throw new RequestError(503, "The controlled pilot is unavailable. Please try again later.");
  // Only trust Vercel's overwritten ingress header on that deployment. On other
  // hosts use a shared bucket until the operator installs a trusted ingress.
  const address = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local";
  return createHmac("sha256", secret).update(address.slice(0, 200)).digest("hex");
}
export async function admit(request: Request, userId: string, requestId: string, config: GatewayConfig) {
  const db = pilotStore();
  const { data, error } = await db.rpc("admit_assistant_request", { p_request: requestId, p_user: userId, p_network: networkHash(request), p_minute: config.requestsPerMinute, p_day: config.requestsPerDay, p_ip_minute: config.ipPerMinute });
  if (error) throw new RequestError(503, "The controlled pilot is unavailable. Please try again later.");
  if (data === "duplicate") throw new RequestError(409, "This request was already received. Please send a new question.");
  if (data === "quota_rejection") throw new RequestError(429, "Your pilot request limit has been reached. Please try again later.");
  if (data !== "reserved") throw new RequestError(503, "The controlled pilot is unavailable. Please try again later.");
  return db;
}
export async function completeUsage(db: ReturnType<typeof pilotStore>, requestId: string, update: Pick<AssistantUsage, "state" | "latency_ms" | "retrieval_count" | "request_type">) {
  const environment = process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL_ENV === "preview" ? "preview" : process.env.NODE_ENV === "test" ? "test" : "development";
  const appVersion = process.env.VERCEL_GIT_COMMIT_SHA?.match(/^[a-f0-9]{7,40}$/)?.[0] ?? "local";
  const { error } = await db.from("assistant_usage").update({ ...update, completed_at: new Date().toISOString(), environment, app_version: appVersion,
    // Deterministic processing has no billable provider tokens or provider cost.
    input_tokens: 0, output_tokens: 0, estimated_cost_usd: 0, pricing_version: "deterministic-zero-v1",
  }).eq("request_id", requestId).eq("state", "reserved");
  if (error) throw new RequestError(503, "Unable to complete the pilot request. Please try again later.");
}

// Admission surrounds parsing as well as generation, so authenticated malformed
// and oversized pilot requests consume quota and produce operational evidence.
export async function withPilotUsage(request: Request, requestId: string, run: () => Promise<Response>) {
  const config = gatewayConfig();
  if (!config.pilot) return run();
  const started = Date.now();
  const client = await sessionClient();
  const { data: { user }, error } = await withDeadline(() => client.auth.getUser(), config.timeoutMs, request.signal);
  if (error || !user || user.is_anonymous) throw new RequestError(401, "Sign in to use the controlled Assistant pilot.");
  const store = await withDeadline(() => admit(request, user.id, requestId, config), config.timeoutMs, request.signal);
  let state: AssistantUsage["state"] = "provider_failure";
  let retrievalCount = 0;
  let requestType: AssistantUsage["request_type"] = "chat";
  try {
    const response = await run();
    if (response.ok) {
      const { data } = await response.clone().json() as AiGuideSuccessResponse;
      state = data.grounding === "approved_records" ? "success" : data.grounding === "unavailable" ? "unavailable" : "fallback";
      retrievalCount = data.usage?.retrievalCount ?? 0;
      requestType = data.itinerary ? "itinerary" : data.recommendations?.length ? "recommendation" : "chat";
    } else state = response.status < 500 ? "validation_failure" : response.headers.get("X-Assistant-Failure") === "timeout" ? "timeout" : response.headers.get("X-Assistant-Failure") === "cancelled" ? "cancelled" : "provider_failure";
    response.headers.delete("X-Assistant-Failure");
    return response;
  } finally {
    await withDeadline(() => completeUsage(store, requestId, { state, retrieval_count: retrievalCount, request_type: requestType, latency_ms: Math.min(3600000, Date.now() - started) }), config.timeoutMs);
  }
}
