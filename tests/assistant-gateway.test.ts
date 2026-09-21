import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/utils/supabase/server";
import { respondWithContext } from "@/utils/ai-guide/gateway";

const getUser = vi.fn();
const single = vi.fn();
const eq = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq }));
const input = { language: "en" as const, messages: [{ role: "user" as const, content: "Plan a day" }] };
const request = () => new Request("http://localhost/api/ai-guide", { headers: { cookie: "session=fixture" } });
beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "owner-a" } } });
  vi.mocked(createClient).mockResolvedValue({ auth: { getUser }, from: () => ({ select }) } as never);
});
it("loads permitted profile context using the authenticated owner", async () => {
  single.mockResolvedValue({ data: { travel_profile: { trip: { area: "Windhoek" }, consents: { personalisation: { status: "granted" } } } }, error: null });
  const result = await respondWithContext(input, request());
  expect(eq).toHaveBeenCalledWith("id", "owner-a");
  expect(result.itinerary?.area).toBe("Windhoek");
});
it("reloads consent and stops profile use after withdrawal", async () => {
  single.mockResolvedValue({ data: { travel_profile: { trip: { area: "Windhoek" }, consents: { personalisation: { status: "withdrawn" } } } }, error: null });
  expect((await respondWithContext(input, request())).clarification).toBe("area");
});
it("fails closed on a profile lookup error while keeping the demo usable", async () => {
  single.mockResolvedValue({ data: null, error: { message: "internal database error" } });
  const result = await respondWithContext(input, request());
  expect(result.clarification).toBe("area");
  expect(result.message).not.toContain("database");
});
it("does not load any account context for anonymous requests", async () => {
  expect((await respondWithContext(input, new Request("http://localhost"))).clarification).toBe("area");
  expect(createClient).not.toHaveBeenCalled();
});
