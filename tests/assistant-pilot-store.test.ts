import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
import { createClient as sessionClient } from "@/utils/supabase/server";
import { createClient as privilegedClient } from "@supabase/supabase-js";
import { withPilotUsage } from "@/utils/ai-guide/pilot-store";
const getUser = vi.fn();
const rpc = vi.fn();
const update = vi.fn();
const eq = vi.fn();
const request = () => new Request("http://localhost/api/ai-guide", { headers: { cookie: "synthetic" } });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ASSISTANT_PILOT_ENABLED", "true");
  vi.stubEnv("ASSISTANT_NETWORK_SECRET", "synthetic-secret-more-than-32-characters");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-never-a-real-key");
  getUser.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
  rpc.mockResolvedValue({ data: "reserved", error: null });
  const chain = { eq, then: (resolve: (value: unknown) => void) => resolve({ error: null }) };
  eq.mockReturnValue(chain);
  update.mockReturnValue(chain);
  vi.mocked(sessionClient).mockResolvedValue({ auth: { getUser } } as never);
  vi.mocked(privilegedClient).mockReturnValue({ rpc, from: () => ({ update }) } as never);
});
afterEach(() => vi.unstubAllEnvs());
it("rejects unauthenticated pilot requests before quota admission or processing", async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: null });
  const run = vi.fn();
  await expect(withPilotUsage(request(), "request", run)).rejects.toMatchObject({ status: 401 });
  expect(run).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});
it.each([["quota_rejection", 429], ["duplicate", 409]])("does not process %s requests", async (state, status) => {
  rpc.mockResolvedValue({ data: state, error: null });
  const run = vi.fn();
  await expect(withPilotUsage(request(), "request", run)).rejects.toMatchObject({ status });
  expect(run).not.toHaveBeenCalled();
});
it("records malformed requests without their body or errors", async () => {
  await withPilotUsage(request(), "request", async () => Response.json({ error: "PRIVATE-PROMPT" }, { status: 400 }));
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ state: "validation_failure", retrieval_count: 0 }));
  expect(JSON.stringify(update.mock.calls)).not.toContain("PRIVATE-PROMPT");
  expect(rpc.mock.calls[0][1].p_user).toBe("owner");
});
it("records fallback, counts and zero provider cost without response content", async () => {
  await withPilotUsage(request(), "request", async () => Response.json({ data: { message: "PRIVATE-REPLY", grounding: "demo", usage: { retrievalCount: 3 } } }));
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ state: "fallback", retrieval_count: 3, input_tokens: 0, estimated_cost_usd: 0 }));
  expect(JSON.stringify(update.mock.calls)).not.toContain("PRIVATE-REPLY");
  expect(eq).toHaveBeenCalledWith("state", "reserved");
});
it("records timeouts and removes internal failure headers", async () => {
  const response = await withPilotUsage(request(), "request", async () => new Response(null, { status: 503, headers: { "X-Assistant-Failure": "timeout" } }));
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ state: "timeout" }));
  expect(response.headers.has("X-Assistant-Failure")).toBe(false);
});
it("fails closed when quota storage is unavailable", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "PRIVATE DATABASE DETAIL" } });
  const run = vi.fn();
  await expect(withPilotUsage(request(), "request", run)).rejects.toMatchObject({ status: 503 });
  expect(run).not.toHaveBeenCalled();
});
