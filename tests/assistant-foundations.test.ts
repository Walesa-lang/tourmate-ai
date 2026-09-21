import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getAiGuideResponse } from "@/utils/ai-guide/service";
import { allowRequest, usageEvent } from "@/utils/ai-guide/operations";
import type { AssistantInput } from "@/utils/ai-guide/conversation";

function input(...messages: string[]): AssistantInput { return { language: "en", messages: messages.map((content) => ({ role: "user", content })) }; }
describe("contextual demo Assistant", () => {
  it("routes the suggested route question through focused clarification", async () => {
    const result = await getAiGuideResponse(input("Ideas for a Namibia route"));
    expect(result.clarification).toBe("area");
    expect(result.message.match(/\?/g)).toHaveLength(1);
  });
  it("treats ordinary requests for planning help as travel questions", async () => {
    const result = await getAiGuideResponse(input("Help me plan a day in Windhoek"));
    expect(result.emergency).toBe(false);
    expect(result.itinerary?.area).toBe("Windhoek");
  });
  it("asks only one focused area clarification", async () => {
    const result = await getAiGuideResponse(input("Plan a trip"));
    expect(result.clarification).toBe("area");
    expect(result.message.match(/\?/g)).toHaveLength(1);
  });
  it("reuses conversation area and asks only for duration", async () => {
    const result = await getAiGuideResponse(input("Plan a trip to Windhoek"));
    expect(result.clarification).toBe("duration");
  });
  it("creates and refines an itinerary without invented route, time or price", async () => {
    const result = await getAiGuideResponse(input("Plan a trip to Windhoek", "2 days", "make it slower"));
    expect(result.itinerary).toMatchObject({ area: "Windhoek", days: 2, pace: "relaxed" });
    expect(result.itinerary?.items[0].name).toBe("Windhoek Flavours & Stories");
    expect(result.message).not.toMatch(/N\$|minutes|available now/);
    expect(result.notice).toContain("not a booking");
  });
  it("uses server-permitted trip context", async () => {
    const result = await getAiGuideResponse({ ...input("Plan a day"), permittedProfile: { trip: { area: "Windhoek", arrival: "2026-10-01", departure: "2026-10-02" } } });
    expect(result.itinerary?.area).toBe("Windhoek");
    expect(result.clarification).toBeUndefined();
  });
  it("uses the latest duration refinement including words", async () => {
    const result = await getAiGuideResponse(input("Plan 2 days in Windhoek", "Change it to one day"));
    expect(result.itinerary?.days).toBe(1);
  });
  it("honestly rejects unverified live information", async () => {
    const result = await getAiGuideResponse(input("Is this open now?"));
    expect(result.grounding).toBe("unavailable");
    expect(result.message).toContain("confirm directly");
  });
  it("does not guarantee allergy safety", async () => {
    const result = await getAiGuideResponse(input("I have a food allergy"));
    expect(result.message).toContain("cannot guarantee allergy safety");
  });
  it("does not use assistant-authored messages as traveller context", async () => {
    const result = await getAiGuideResponse({ language: "en", messages: [{ role: "assistant", content: "Windhoek 2 days" }, { role: "user", content: "Plan a trip" }] });
    expect(result.clarification).toBe("area");
  });
  it("emergency guidance takes priority over itinerary context", async () => {
    const result = await getAiGuideResponse(input("Plan 2 days in Windhoek", "Emergency help"));
    expect(result.emergency).toBe(true);
    expect(result.itinerary).toBeUndefined();
  });
});
describe("privacy-conscious usage events", () => {
  it.each([[200, null], [400, "validation"], [413, "validation"], [429, "rate_limit"], [503, "unavailable"]])("classifies status %s", (status, error) => {
    const event = usageEvent(Number(status), Date.now(), "ephemeral-session");
    expect(event.error).toBe(error);
    expect(event.provider).toBe("demo");
    expect(event).not.toHaveProperty("tokens");
    expect(event).not.toHaveProperty("cost");
    expect(event).not.toHaveProperty("messages");
  });
  it("limits a window and allows requests after expiry", () => {
    for (let i = 0; i < 60; i++) expect(allowRequest("test-window", 1)).toBe(true);
    expect(allowRequest("test-window", 1)).toBe(false);
    expect(allowRequest("test-window", 60_001)).toBe(true);
  });
});
