import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";

const salt = randomBytes(32).toString("hex");
const windows = new Map<string, { start: number; count: number }>();
export function anonymousKey(request: Request) {
  // Ephemeral pseudonym, never the raw network address. Resets on restart.
  const network = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local";
  return createHash("sha256").update(salt + network.slice(0, 200)).digest("hex").slice(0, 24);
}
export function recordSavedAction(userId: string, action: "save" | "remove", itinerary: boolean) {
  console.info(JSON.stringify({ event: "assistant_saved_action", request_id: randomUUID(), timestamp: new Date().toISOString(), account: createHash("sha256").update(salt + userId).digest("hex"), action, item_kind: itinerary ? "itinerary" : "recommendation" }));
}
export function allowRequest(key: string, now = Date.now()) {
  for (const [id, entry] of windows) if (now - entry.start >= 60_000) windows.delete(id);
  const entry = windows.get(key) ?? { start: now, count: 0 };
  if (windows.size >= 5000 && !windows.has(key)) return false;
  entry.count++; windows.set(key, entry);
  return entry.count <= 60;
}
export type UsageEvent = {
  timestamp: string; request_id: string; session: string; provider: "demo"; model: "deterministic-v1";
  state: "success" | "failure" | "fallback"; latency_ms: number; category: "catalogue" | "demo";
  input_tokens: number; output_tokens: number; estimated_cost_usd: number; pricing_version: string; retrieval_count: number; tool_count: number;
  error: "validation" | "rate_limit" | "unavailable" | null;
};
export function usageEvent(status: number, start: number, session: string, category: UsageEvent["category"] = "demo"): UsageEvent {
  return { timestamp: new Date().toISOString(), request_id: randomUUID(), session, provider: "demo", model: "deterministic-v1", state: status < 400 ? "success" : "failure", latency_ms: Math.max(0, Date.now() - start), category, error: status < 400 ? null : status === 429 ? "rate_limit" : status < 500 ? "validation" : "unavailable", input_tokens: 0, output_tokens: 0, estimated_cost_usd: 0, pricing_version: "deterministic-zero-v1", retrieval_count: 0, tool_count: 0 };
}
export function recordUsage(event: UsageEvent) {
  // Deliberately no messages, user IDs, profile values, raw IPs or provider text.
  console.info(JSON.stringify({ event: "assistant_request", ...event }));
}
