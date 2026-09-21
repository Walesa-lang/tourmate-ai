import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/utils/supabase/server";
import { GET as getProfile, POST as saveProfile } from "@/app/api/profile/route";
import { GET as getSaved, POST as saveItem } from "@/app/api/saved/route";

const getUser = vi.fn();
const rpc = vi.fn();
const query = { select: vi.fn(), eq: vi.fn(), single: vi.fn(), order: vi.fn(), limit: vi.fn(), upsert: vi.fn(), delete: vi.fn(), then: undefined as unknown };
const from = vi.fn(() => query);
function request(body: unknown) { return new Request("http://localhost/api/profile", { method: "POST", headers: { origin: "http://localhost", "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "owner-a", email: "owner@example.test" } }, error: null });
  vi.mocked(createClient).mockResolvedValue({ auth: { getUser }, from, rpc } as never);
  for (const method of [query.select, query.eq, query.order, query.delete]) method.mockReturnValue(query);
  query.single.mockResolvedValue({ data: { full_name: "Traveller", travel_profile: { trip: { area: "Windhoek" } } }, error: null });
  query.limit.mockResolvedValue({ data: [], error: null });
  query.upsert.mockResolvedValue({ error: null });
  query.then = (resolve: (v: unknown) => void) => resolve({ error: null });
  rpc.mockResolvedValue({ data: { completed: ["trip"] }, error: null });
});

describe("authenticated profile operations", () => {
  it("restores only the authenticated owner's profile", async () => {
    const response = await getProfile();
    expect(response.status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith("id", "owner-a");
    expect(await response.json()).toMatchObject({ travel_profile: { trip: { area: "Windhoek" } } });
  });
  it.each(["step", "skip", "delete"])("supports %s without accepting client ownership", async (action) => {
    const response = await saveProfile(request({ action, stage: "trip", data: { area: "Etosha" }, user_id: "victim" }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("update_travel_profile", { p_action: action, p_payload: action === "step" ? { stage: "trip", data: { area: "Etosha" } } : { stage: "trip" } });
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("victim");
  });
  it.each([true, false])("supports purpose-specific consent %s", async (granted) => {
    expect((await saveProfile(request({ action: "consent", purpose: "food", granted }))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("update_travel_profile", { p_action: "consent", p_payload: { purpose: "food", granted } });
  });
  it("rejects invalid dates and never mutates", async () => {
    const response = await saveProfile(request({ action: "step", stage: "trip", data: { arrival: "2026-02-30" } }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects activating location and safety consent", async () => {
    for (const purpose of ["location", "safety"]) expect((await saveProfile(request({ action: "consent", purpose, granted: true }))).status).toBe(400);
  });
  it("returns safe errors without database details", async () => {
    rpc.mockResolvedValue({ error: { message: "secret internal SQL" } });
    const response = await saveProfile(request({ action: "skip", stage: "food" }));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
  });
  it("rejects anonymous reads and mutations", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await getProfile()).status).toBe(401);
    expect((await saveProfile(request({ action: "skip", stage: "food" }))).status).toBe(401);
    expect((await getSaved()).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("saved recommendations ownership and idempotency", () => {
  const item = { id: "etosha-safari-lodge", type: "hotel" };
  it("uses owner-scoped uniqueness and canonical snapshots on repeated saves", async () => {
    for (let i = 0; i < 2; i++) expect((await saveItem(request({ action: "save", ...item, user_id: "victim", reason: "sensitive conversation" }))).status).toBe(200);
    expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "owner-a", item_id: item.id }), { onConflict: "user_id,item_type,item_id", ignoreDuplicates: true });
    expect(JSON.stringify(query.upsert.mock.calls)).not.toMatch(/victim|sensitive conversation/);
  });
  it("removes only the authenticated owner's selected record", async () => {
    expect((await saveItem(request({ action: "remove", ...item, user_id: "victim" }))).status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner-a");
    expect(query.eq).toHaveBeenCalledWith("item_id", item.id);
    expect(query.eq).toHaveBeenCalledWith("item_type", "hotel");
  });
  it("rejects invented IDs and itinerary days", async () => {
    expect((await saveItem(request({ action: "save", ...item, id: "unknown" }))).status).toBe(400);
    expect((await saveItem(request({ action: "save", ...item, day: 999 }))).status).toBe(400);
    expect(query.upsert).not.toHaveBeenCalled();
  });
  it("blocks cross-origin mutations", async () => {
    const req = new Request("http://localhost/api/saved", { method: "POST", headers: { origin: "https://other.example" }, body: JSON.stringify({ action: "save", ...item }) });
    expect((await saveItem(req)).status).toBe(403);
  });
});
