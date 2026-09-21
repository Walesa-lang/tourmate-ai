import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getAiGuideResponse } from "@/utils/ai-guide/service";
import type { Language } from "@/app/i18n/translations";

describe("AI Guide demo service", () => {
  it("selects the response from the latest user message", async () => {
    const response = await getAiGuideResponse({
      language: "fr",
      messages: [
        { role: "user", content: "I need a hotel" },
        { role: "assistant", content: "Previous response" },
        { role: "user", content: "Bonjour" },
      ],
    });

    expect(response.emergency).toBe(false);
    expect(response.message).toContain("Bonjour");
  });

  it("marks emergency responses for the client safety warning", async () => {
    const response = await getAiGuideResponse({
      language: "zh",
      messages: [{ role: "user", content: "紧急情况" }],
    });

    expect(response.emergency).toBe(true);
    expect(response.message.length).toBeGreaterThan(20);
  });

  it("returns the existing Etosha listing instead of the generic accommodation response", async () => {
    const response = await getAiGuideResponse({
      language: "en",
      messages: [{ role: "user", content: "Recommend a hotel near Etosha" }],
    });

    expect(response.message).toContain("Etosha Safari Lodge");
    expect(response.message).not.toContain("N$3,250");
    expect(response.message).toContain("demo information");
    expect(response.message).not.toContain("Windhoek has city hotels");
    expect(response.message).not.toContain("Swakopmund has coastal stays");
  });

  it.each([
    ["en", "demo information"],
    ["fr", "informations de démonstration"],
    ["es", "información de demostración"],
    ["pt", "informações de demonstração"],
    ["zh", "演示信息"],
  ] satisfies Array<[Language, string]>) (
    "returns destination-aware Etosha accommodation in %s",
    async (language, disclaimer) => {
      const response = await getAiGuideResponse({
        language,
        messages: [{ role: "user", content: "Recommend accommodation near Etosha" }],
      });

      expect(response.message).toContain("Etosha Safari Lodge");
      expect(response.message).not.toContain("4.9");
      expect(response.message).not.toContain("N$3,250");
      expect(response.message).toContain(disclaimer);
    },
  );

  it.each([
    ["Windhoek", "Windhoek Garden Hotel"],
    ["Swakopmund", "Atlantic Breeze Guesthouse"],
    ["Sossusvlei", "Sossus Dune Camp"],
    ["Sossusvlei", "Desert Quiver Lodge"],
  ])("matches %s accommodation to the existing %s listing", async (destination, property) => {
    const response = await getAiGuideResponse({
      language: "en",
      messages: [{ role: "user", content: `Recommend a hotel near ${destination}` }],
    });

    expect(response.message).toContain(property);
  });

  it.each([
    ["general trip", "Plan a five day trip", "demo itinerary", false],
    ["transport", "How should I get around by bus?", "Transport depends", false],
    ["attraction", "Recommend an attraction to visit", "shortlist", false],
    ["emergency", "I need emergency help", "immediate danger", true],
  ])("preserves the existing %s response", async (_name, content, expected, emergency) => {
    const response = await getAiGuideResponse({
      language: "en",
      messages: [{ role: "user", content }],
    });

    expect(response.message).toContain(expected);
    expect(response.emergency).toBe(emergency);
  });
});
