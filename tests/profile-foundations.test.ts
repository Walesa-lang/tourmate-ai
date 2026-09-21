import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { permittedContext, validateStep, type TravelProfile } from "@/utils/profile";
import { boundedJson } from "@/utils/http";

describe("profile validation and consent", () => {
  it.each([
    ["trip", { arrival: "2026-02-30" }, "arrival"],
    ["trip", { arrival: "2026-10-10", departure: "2026-10-01" }, "departure"],
    ["trip", { travellers: "1.5" }, "travellers"],
    ["trip", { travellers: "101" }, "travellers"],
    ["preferences", { pace: "unsafe" }, "pace"],
    ["account", { language: "invalid" }, "language"],
    ["food", { allergies: "x".repeat(301) }, "allergies"],
    ["interests", { selected: ["inferred religion"] }, "selected"],
    ["trip", { user_id: "other-user" }, "form"],
  ] as const)("rejects invalid %s data", (stage, data, key) => {
    expect(validateStep(stage, data).errors[key]).toBeTruthy();
  });
  it("accepts missing optional answers and deduplicates selected interests", () => {
    expect(validateStep("trip", {}).errors).toEqual({});
    expect(validateStep("interests", { selected: ["Nature", "Nature"] }).data.selected).toEqual(["Nature"]);
  });
  it("never uses optional profile data without purpose-specific consent", () => {
    const profile: TravelProfile = { trip: { area: "Windhoek" }, food: { allergies: "private" } };
    expect(permittedContext(profile)).toEqual({});
    profile.consents = { personalisation: { status: "granted", version: "v1", source: "profile", granted_at: "today", withdrawn_at: null, updated_at: "today" } };
    expect(permittedContext(profile).trip).toEqual(profile.trip);
    expect(permittedContext(profile).food).toBeUndefined();
    profile.consents.personalisation!.status = "withdrawn";
    expect(permittedContext(profile)).toEqual({});
  });
  it("bounds streamed request bodies even without content-length", async () => {
    const request = new Request("http://localhost", { method: "POST", body: JSON.stringify({ text: "x".repeat(100) }) });
    await expect(boundedJson(request, 20)).rejects.toMatchObject({ status: 413 });
  });
});

describe("migration and RLS structural controls", () => {
  const sql = readFileSync("supabase/migrations/20260920194931_profile_assistant_foundations.sql", "utf8");
  const base = readFileSync("supabase/migrations/20260803165735_create_user_data_foundation.sql", "utf8");
  it("adds to the owner-protected profile without granting direct travel-profile writes", () => {
    expect(sql).toContain("alter table public.profiles add column travel_profile");
    expect(base).toContain("alter table public.profiles enable row level security");
    expect(base).toContain("using ((select auth.uid()) = id)");
    expect(base).toContain("with check ((select auth.uid()) = id)");
    expect(sql).not.toMatch(/grant update.*travel_profile/i);
    expect(sql).not.toMatch(/drop table|disable row level security/i);
  });
  it("derives ownership inside the narrow RPC and prevents anonymous execution", () => {
    expect(sql).toContain("owner uuid := (select auth.uid())");
    expect(sql).toContain("if owner is null then raise exception");
    expect(sql).toContain("where id = owner for update");
    expect(sql.match(/where id = owner/g)?.length).toBe(3);
    expect(sql).toContain("security definer set search_path = ''");
    expect(sql).toContain("revoke all on function public.update_travel_profile(text,jsonb) from public, anon, authenticated");
    expect(sql).toContain("grant execute on function public.update_travel_profile(text,jsonb) to authenticated");
  });
  it("enforces food consent, withdrawal deletion and server-generated consent timestamps", () => {
    expect(sql).toContain("Food consent required");
    expect(sql).toContain("profile := profile - 'food'");
    for (const field of ["granted_at", "withdrawn_at", "updated_at", "source", "version"]) expect(sql).toContain(`'${field}'`);
    expect(sql).toContain("Purpose not active");
  });
  it("retains SELECT INSERT UPDATE DELETE ownership and idempotency on favourites", () => {
    for (const action of ["select", "insert", "update", "delete"]) expect(base).toMatch(new RegExp(`on public\\.favourites\\s+for ${action}\\s+to authenticated`));
    expect(base).toContain("unique (user_id, item_type, item_id)");
    expect(base).toContain("with check ((select auth.uid()) = user_id)");
  });
});
