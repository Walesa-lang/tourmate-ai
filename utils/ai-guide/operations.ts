import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";

const salt = randomBytes(32).toString("hex");
const windows = new Map<string, { start: number; count: number }>();
export function anonymousKey(request: Request) {
  // Ephemeral pseudonym, never the raw network address. Resets on restart.
  return createHash("sha256").update(salt + (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local")).digest("hex").slice(0, 24);
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
  state: "success" | "failure"; latency_ms: number; category: "catalogue" | "demo";
  error: "validation" | "rate_limit" | "unavailable" | null;
};
export function usageEvent(status: number, start: number, session: string, category: UsageEvent["category"] = "demo"): UsageEvent {
  return { timestamp: new Date().toISOString(), request_id: randomUUID(), session, provider: "demo", model: "deterministic-v1", state: status < 400 ? "success" : "failure", latency_ms: Math.max(0, Date.now() - start), category, error: status < 400 ? null : status === 429 ? "rate_limit" : status < 500 ? "validation" : "unavailable" };
}
export function recordUsage(event: UsageEvent) {
  // Deliberately no messages, user IDs, profile values, IPs, tokens or costs.
  console.info(JSON.stringify({ event: "assistant_request", ...event }));
}
