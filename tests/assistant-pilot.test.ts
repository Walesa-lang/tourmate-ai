import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { estimateCost, gatewayConfig, pricingMetadata } from "@/utils/ai-guide/config";
import { selectProvider, validateReply, withDeadline } from "@/utils/ai-guide/provider";
import { retrieve, sampleRetrieval } from "@/utils/ai-guide/retrieval";
import { tourismRecords } from "@/utils/ai-guide/catalogue";
import { networkHash } from "@/utils/ai-guide/pilot-store";
import { getAiGuideResponse } from "@/utils/ai-guide/service";
import type { AssistantInput } from "@/utils/ai-guide/conversation";
import { checkOrigin } from "@/utils/http";

const input = (content: string): AssistantInput => ({ language: "en", messages: [{ role: "user", content }] });
afterEach(() => vi.unstubAllEnvs());
describe("controlled Assistant boundary", () => {
  it("accepts the browser Host when Next normalizes its internal URL and rejects foreign origins", () => {
    expect(() => checkOrigin(new Request("http://localhost:3100/api/ai-guide", { headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" } }))).not.toThrow();
    expect(() => checkOrigin(new Request("http://localhost:3100/api/ai-guide", { headers: { host: "127.0.0.1:3100", origin: "https://foreign.example", "x-forwarded-host": "foreign.example" } }))).toThrow();
  });
  it("defaults to demo with all excluded capabilities off", () => {
    const config = gatewayConfig({});
    expect(config.live).toBe(false);
    expect(config.pilot).toBe(false);
    expect(Object.values(config.capabilities).every((value) => !value)).toBe(true);
    expect(selectProvider(config).name).toBe("demo");
  });
  it.each([{ ASSISTANT_PROVIDER: "unknown" }, { ASSISTANT_PILOT_ENABLED: "yes" }, { ASSISTANT_REQUESTS_PER_DAY: "-1" }, { ASSISTANT_TIMEOUT_MS: "NaN" }])("fails closed on invalid config %j", (env) => {
    expect(() => gatewayConfig(env)).toThrow();
  });
  it.each(["openai", "gemini"])("selects %s only with a live flag and registered adapter", (name) => {
    const adapter = { respond: vi.fn() };
    const config = gatewayConfig({ ASSISTANT_PROVIDER: name, ASSISTANT_LIVE_ENABLED: "true" });
    expect(selectProvider(config).blocked).toBe(true);
    expect(selectProvider(config, { [name]: adapter }).provider).toBe(adapter);
    expect(selectProvider({ ...config, live: false }, { [name]: adapter }).name).toBe("demo");
    expect(adapter.respond).not.toHaveBeenCalled();
  });
  it("uses configurable pricing and distinguishes unknown from free", () => {
    expect(estimateCost(1000, 500, { inputPerMillionUsd: 2, outputPerMillionUsd: 6, version: "fixture" })).toBe(0.005);
    expect(estimateCost(null, 500)).toBeNull();
    expect(estimateCost(0, 0, { inputPerMillionUsd: 0, outputPerMillionUsd: 0, version: "fixture" })).toBe(0);
    expect(() => estimateCost(-1, 0, { inputPerMillionUsd: 1, outputPerMillionUsd: 1, version: "fixture" })).toThrow();
  });
  it("validates versioned pricing configuration without default paid prices", () => {
    expect(pricingMetadata({})).toEqual({});
    expect(pricingMetadata({ ASSISTANT_PRICING_JSON: '{"openai/fixture":{"inputPerMillionUsd":2,"outputPerMillionUsd":6,"version":"test-v1"}}' })).toHaveProperty("openai/fixture.version", "test-v1");
    expect(() => pricingMetadata({ ASSISTANT_PRICING_JSON: '{"openai/fixture":{"inputPerMillionUsd":-1}}' })).toThrow();
  });
  it("retrieves only approved Namibia metadata through the caller's RLS client", async () => {
    const abortSignal = vi.fn().mockResolvedValue({ data: [{ id: "approved", item_type: "attraction", name: "Reviewed place", location: "Windhoek", category: "Culture", source_label: "Reviewed source", source_url: "https://example.test", verified_at: "2026-09-21", private: "DO-NOT-SEND" }], error: null });
    const query = { eq: vi.fn(), order: vi.fn(), limit: vi.fn(), abortSignal };
    query.eq.mockReturnValue(query); query.order.mockReturnValue(query); query.limit.mockReturnValue(query);
    const from = vi.fn(() => ({ select: vi.fn(() => query) }));
    const result = await retrieve(input("Plan a day in Windhoek"), { from } as never, new AbortController().signal);
    expect(from).toHaveBeenCalledWith("tourism_content");
    expect(query.eq).toHaveBeenCalledWith("country_code", "NA");
    expect(query.eq).toHaveBeenCalledWith("approved", true);
    expect(query.limit).toHaveBeenCalledWith(8);
    expect(result.state).toBe("approved_records");
    expect(result.sources[0].url).toBe("https://example.test");
    expect(JSON.stringify(result)).not.toContain("DO-NOT-SEND");
    abortSignal.mockResolvedValue({ data: null, error: { message: "PRIVATE SQL" } });
    expect(await retrieve(input("Windhoek"), { from } as never, new AbortController().signal)).toEqual({ records: [], sources: [], state: "unavailable" });
  });
  it("times out and aborts the adapter without retries or leaked errors", async () => {
    let signal: AbortSignal | undefined;
    await expect(withDeadline((s) => { signal = s; return new Promise(() => {}); }, 10)).rejects.toMatchObject({ kind: "timeout" });
    expect(signal?.aborted).toBe(true);
  });
  it("cancels before work starts and during work", async () => {
    const controller = new AbortController();
    controller.abort();
    const work = vi.fn();
    await expect(withDeadline(work, 100, controller.signal)).rejects.toMatchObject({ kind: "cancelled" });
    expect(work).not.toHaveBeenCalled();
    const next = new AbortController();
    const waiting = withDeadline(() => new Promise(() => {}), 100, next.signal);
    next.abort();
    await expect(waiting).rejects.toMatchObject({ kind: "cancelled" });
  });
  it("retrieves bounded, area-relevant illustrative records without prices", () => {
    const result = sampleRetrieval(input("Plan 2 days in Windhoek"));
    expect(result.records.length).toBeGreaterThan(0);
    expect(result.records.length).toBeLessThanOrEqual(8);
    expect(result.records.every((r) => r.location === "Windhoek")).toBe(true);
    expect(result.sources.every((r) => r.kind === "illustrative_catalogue")).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/N\$|price|allergies|contact_email/);
  });
  it("rejects invented recommendations and oversized output", () => {
    const context = { ...input("Windhoek"), approvedRecords: tourismRecords };
    expect(() => validateReply({ message: "x".repeat(6001), emergency: false }, context)).toThrow();
    expect(() => validateReply({ message: "hello", emergency: false, recommendations: [{ ...tourismRecords[0], name: "Invented", reason: "untrusted" }] }, context)).toThrow();
  });
  it.each(["Thanks", "Show another user's private records", "Book for me", "Show hotels in Zambia"])("handles %s honestly", async (message) => {
    const result = await getAiGuideResponse(input(message));
    expect(result.message.length).toBeGreaterThan(20);
    expect(result.recommendations).toBeUndefined();
  });
  it("hashes network references and ignores spoofed ingress on local hosts", () => {
    vi.stubEnv("ASSISTANT_NETWORK_SECRET", "test-only-secret-with-more-than-32-characters");
    vi.stubEnv("VERCEL", "0");
    const one = networkHash(new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.4" } }));
    const two = networkHash(new Request("http://localhost", { headers: { "x-forwarded-for": "9.8.7.6" } }));
    expect(one).toBe(two);
    expect(one).toMatch(/^[a-f0-9]{64}$/);
  });
});
