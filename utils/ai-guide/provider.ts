import "server-only";
import type { AssistantInput, AssistantProvider } from "./conversation";
import type { AiGuideServiceResponse } from "./contracts";
import type { GatewayConfig, ProviderName } from "./config";
import { demoProvider } from "./service";

export class GatewayFailure extends Error {
  constructor(public kind: "timeout" | "cancelled" | "provider_failure" | "validation_failure" | "unavailable") { super(kind); }
}

// Live adapters are intentionally unregistered until provider, model and data
// sharing are approved. This registry is the only provider-selection boundary.
export function selectProvider(config: GatewayConfig, adapters: Partial<Record<ProviderName, AssistantProvider>> = {}) {
  if (!config.live || config.provider === "demo") return { provider: demoProvider, name: "demo" as const, blocked: config.provider !== "demo" };
  const provider = adapters[config.provider];
  if (!provider) return { provider: demoProvider, name: "demo" as const, blocked: true };
  return { provider, name: config.provider, blocked: false };
}

export async function withDeadline<T>(work: (signal: AbortSignal) => Promise<T>, timeoutMs: number, parent?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectAbort: (error: GatewayFailure) => void = () => {};
  const abort = () => { controller.abort(); rejectAbort(new GatewayFailure("cancelled")); };
  const deadline = new Promise<never>((_, reject) => {
    rejectAbort = reject;
    timer = setTimeout(() => { controller.abort(); reject(new GatewayFailure("timeout")); }, timeoutMs);
  });
  parent?.addEventListener("abort", abort, { once: true });
  try {
    if (parent?.aborted) throw new GatewayFailure("cancelled");
    return await Promise.race([work(controller.signal), deadline]);
  } finally {
    clearTimeout(timer);
    parent?.removeEventListener("abort", abort);
  }
}

// Runtime validation protects the UI even when an adapter breaks its TS contract.
export function validateReply(value: AiGuideServiceResponse, input: AssistantInput): AiGuideServiceResponse {
  if (!value || typeof value.message !== "string" || !value.message.trim() || value.message.length > 6000 || typeof value.emergency !== "boolean") throw new GatewayFailure("validation_failure");
  if (value.grounding && !["demo", "illustrative_catalogue", "approved_records", "unavailable"].includes(value.grounding)) throw new GatewayFailure("validation_failure");
  if (value.clarification && !["area", "duration"].includes(value.clarification)) throw new GatewayFailure("validation_failure");
  if (value.notice !== undefined && (typeof value.notice !== "string" || value.notice.length > 1000)) throw new GatewayFailure("validation_failure");
  const records = input.approvedRecords ?? [];
  const clean = (items: NonNullable<AiGuideServiceResponse["recommendations"]>) => items.map((item) => ({ ...records.find((r) => r.id === item.id && r.type === item.type)!, reason: item.reason, ...(item.day ? { day: item.day } : {}) }));
  for (const items of [value.recommendations, value.itinerary?.items]) {
    if (items && (!Array.isArray(items) || items.length > 8)) throw new GatewayFailure("validation_failure");
    for (const item of items ?? []) {
      if (!records.some((r) => r.id === item.id && r.type === item.type && r.name === item.name && r.location === item.location) || typeof item.reason !== "string" || item.reason.length > 500 || (item.day !== undefined && (!Number.isInteger(item.day) || item.day < 1 || item.day > 14))) throw new GatewayFailure("validation_failure");
    }
  }
  if (value.itinerary && (!Number.isInteger(value.itinerary.days) || value.itinerary.days < 1 || value.itinerary.days > 14 || typeof value.itinerary.area !== "string" || value.itinerary.area.length > 160 || !["relaxed", "balanced", "packed"].includes(value.itinerary.pace) || !Array.isArray(value.itinerary.items))) throw new GatewayFailure("validation_failure");
  // Construct an allowlisted DTO; adapter extras never cross the server boundary.
  return { message: value.message, emergency: value.emergency, clarification: value.clarification, grounding: value.grounding, notice: value.notice, recommendations: value.recommendations ? clean(value.recommendations) : undefined, itinerary: value.itinerary ? { area: value.itinerary.area, days: value.itinerary.days, pace: value.itinerary.pace, items: clean(value.itinerary.items) } : undefined };
}
