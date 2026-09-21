import "server-only";

export type ProviderName = "demo" | "openai" | "gemini";
export type GatewayConfig = ReturnType<typeof gatewayConfig>;

function integer(value: string | undefined, fallback: number, min: number, max: number) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new Error("Invalid Assistant configuration");
  return number;
}
function flag(value: string | undefined) {
  if (value !== undefined && value !== "true" && value !== "false") throw new Error("Invalid Assistant flag");
  return value === "true";
}
export function gatewayConfig(env: Record<string, string | undefined> = process.env) {
  const provider = env.ASSISTANT_PROVIDER ?? "demo";
  if (!["demo", "openai", "gemini"].includes(provider)) throw new Error("Invalid Assistant provider");
  return {
    provider: provider as ProviderName,
    pilot: flag(env.ASSISTANT_PILOT_ENABLED),
    live: flag(env.ASSISTANT_LIVE_ENABLED),
    timeoutMs: integer(env.ASSISTANT_TIMEOUT_MS, 8000, 100, 20000),
    requestsPerMinute: integer(env.ASSISTANT_REQUESTS_PER_MINUTE, 20, 1, 60),
    requestsPerDay: integer(env.ASSISTANT_REQUESTS_PER_DAY, 100, 1, 1000),
    ipPerMinute: integer(env.ASSISTANT_IP_PER_MINUTE, 60, 1, 300),
    // These capabilities have no approved implementation. Environment flags
    // cannot accidentally activate them.
    capabilities: { voice: false, vision: false, maps: false, payments: false, reminders: false, safety: false } as const,
  };
}

export type Pricing = { inputPerMillionUsd: number; outputPerMillionUsd: number; version: string };
export function pricingMetadata(env: Record<string, string | undefined> = process.env): Record<string, Pricing> {
  const raw: unknown = JSON.parse(env.ASSISTANT_PRICING_JSON ?? "{}");
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).length > 20) throw new Error("Invalid pricing configuration");
  const result: Record<string, Pricing> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!/^(openai|gemini)\/[a-zA-Z0-9._:/-]{1,100}$/.test(key) || !value || typeof value !== "object") throw new Error("Invalid pricing configuration");
    const p = value as Pricing;
    if (typeof p.version !== "string" || !/^[a-zA-Z0-9._-]{1,100}$/.test(p.version) || ![p.inputPerMillionUsd, p.outputPerMillionUsd].every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1000000)) throw new Error("Invalid pricing configuration");
    result[key] = { inputPerMillionUsd: p.inputPerMillionUsd, outputPerMillionUsd: p.outputPerMillionUsd, version: p.version };
  }
  return result;
}
export function estimateCost(input: number | null, output: number | null, pricing?: Pricing): number | null {
  if (input === null || output === null || !pricing) return null;
  if (![input, output].every((n) => Number.isSafeInteger(n) && n >= 0) ||
      ![pricing.inputPerMillionUsd, pricing.outputPerMillionUsd].every((n) => Number.isFinite(n) && n >= 0)) throw new Error("Invalid usage or pricing");
  return Math.round((input * pricing.inputPerMillionUsd + output * pricing.outputPerMillionUsd) / 1_000_000 * 1e9) / 1e9;
}
