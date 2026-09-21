import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
let db: PGlite;
beforeAll(async () => {
  db = await PGlite.create();
  // Only Supabase's platform-owned auth shell is simulated. Every application
  // migration below is executed unchanged by the PostgreSQL engine.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls; create role supabase_auth_admin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  for (const file of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort()) {
    try { await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8")); }
    catch (error) { const detail = error as { message: string; position?: string; internalPosition?: string; internalQuery?: string }; throw new Error(`${file}: ${detail.message}; position ${detail.position}; internal ${detail.internalPosition}: ${detail.internalQuery ?? ""}`); }
  }
  await db.query("insert into auth.users (id,email) values ($1,'a@example.test'),($2,'b@example.test')", [a, b]);
}, 90_000);
beforeEach(async () => {
  await db.exec("begin; set local role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [a]);
});
afterEach(async () => { await db.exec("rollback"); });
afterAll(async () => { await db?.close(); });

async function rpc(action: string, payload: object) {
  const result = await db.query<{ profile: Record<string, unknown> }>("select public.update_travel_profile($1,$2::jsonb) as profile", [action, JSON.stringify(payload)]);
  return result.rows[0].profile;
}

describe("executed migrations and PostgreSQL RLS", () => {
  it("does not expose another account's saved trip history", async () => {
    await db.query("insert into public.saved_trips(user_id,title,destination) values ($1,'Private trip','Windhoek')", [a]);
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [b]);
    expect((await db.query("select * from public.saved_trips")).rows).toHaveLength(0);
    expect((await db.query("delete from public.saved_trips returning id")).rows).toHaveLength(0);
  });
  it("admits atomically, rejects duplicate IDs and enforces quota", async () => {
    await db.exec("set local role service_role");
    const args = [a, a, "a".repeat(64), 1, 5, 5];
    const sql = "select public.admit_assistant_request($1,$2,$3,$4,$5,$6) as state";
    expect((await db.query(sql, args)).rows).toEqual([{ state: "reserved" }]);
    expect((await db.query(sql, args)).rows).toEqual([{ state: "duplicate" }]);
    expect((await db.query(sql, [b, ...args.slice(1)])).rows).toEqual([{ state: "quota_rejection" }]);
    expect((await db.query("select * from public.assistant_usage")).rows).toHaveLength(2);
  });
  it("denies traveller quota admission and metric forgery", async () => {
    await expect(db.query("select public.admit_assistant_request($1,$2,$3,10,100,60)", [a, a, "a".repeat(64)])).rejects.toThrow(/permission denied/);
  });
  it("denies traveller telemetry INSERT", async () => {
    await expect(db.query("insert into public.assistant_usage(request_id,user_id,network_hash) values ($1,$1,$2)", [a, "a".repeat(64)])).rejects.toThrow(/permission denied/);
  });
  it.each(["update public.assistant_usage set state='success'", "delete from public.assistant_usage"])("denies traveller telemetry mutation: %s", async (sql) => {
    await expect(db.query(sql)).rejects.toThrow(/permission denied/);
  });
  it("denies anonymous tourism and telemetry reads", async () => {
    await db.exec("set local role anon");
    await expect(db.query("select * from public.assistant_usage")).rejects.toThrow(/permission denied/);
  });
  it("restricts usage reads and reporting to administrators", async () => {
    await db.exec("set local role service_role");
    await db.query("insert into public.assistant_usage(request_id,user_id,network_hash) values ($1,$1,$2)", [a, "a".repeat(64)]);
    await db.exec("set local role authenticated");
    expect((await db.query("select * from public.assistant_usage")).rows).toHaveLength(0);
    expect((await db.query("select * from public.assistant_usage_summary()")).rows).toHaveLength(0);
    await db.exec("set local role service_role");
    await db.query("insert into public.admin_users(user_id) values ($1)", [b]);
    await db.exec("set local role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [b]);
    expect((await db.query("select * from public.assistant_usage_summary()")).rows).toHaveLength(1);
  });
  it("exposes only approved tourism content and denies client approval", async () => {
    await db.exec("set local role service_role");
    await db.query("insert into public.tourism_content(id,item_type,name,location,category,source_label,source_url,verified_at,approved) values ('approved','attraction','Fixture','Windhoek','Culture','Fixture','https://example.test',now(),true),('draft','hotel','Draft','Windhoek','Stay','Fixture','https://example.test',now(),false)");
    await db.exec("set local role authenticated");
    expect((await db.query("select id from public.tourism_content")).rows).toEqual([{ id: "approved" }]);
    await expect(db.query("update public.tourism_content set approved=true")).rejects.toThrow(/permission denied/);
  });
  it("cascades telemetry, consent, profile and saved data on account deletion", async () => {
    await rpc("consent", { purpose: "food", granted: true });
    await db.query("insert into public.favourites(user_id,item_type,item_id) values ($1,'hotel','fixture')", [a]);
    await db.exec("set local role service_role");
    await db.query("insert into public.assistant_usage(request_id,user_id,network_hash) values ($1,$1,$2)", [a, "a".repeat(64)]);
    await db.exec("reset role");
    await db.query("delete from auth.users where id=$1", [a]);
    for (const [table, column] of [["profiles", "id"], ["favourites", "user_id"], ["assistant_usage", "user_id"]]) expect((await db.query(`select * from public.${table} where ${column}=$1`, [a])).rows).toHaveLength(0);
  });
  it("restricts profile SELECT and UPDATE to the authenticated owner", async () => {
    expect((await db.query("select id from public.profiles")).rows).toEqual([{ id: a }]);
    expect((await db.query("update public.profiles set full_name='Intruder' where id=$1 returning id", [b])).rows).toEqual([]);
    expect((await db.query("update public.profiles set full_name='Amina' where id=$1 returning full_name", [a])).rows).toEqual([{ full_name: "Amina" }]);
  });
  it("saves, restores, edits, skips and deletes optional profile stages", async () => {
    await rpc("step", { stage: "trip", data: { area: "Windhoek", travellers: "2" } });
    const restored = await db.query<{ travel_profile: { trip: { area: string } } }>("select travel_profile from public.profiles where id=$1", [a]);
    expect(restored.rows[0].travel_profile.trip.area).toBe("Windhoek");
    expect(await rpc("step", { stage: "trip", data: { area: "Etosha" } })).toMatchObject({ trip: { area: "Etosha" } });
    expect(await rpc("skip", { stage: "interests" })).toMatchObject({ completed: expect.arrayContaining(["interests", "trip"]) });
    expect(await rpc("delete", { stage: "trip" })).not.toHaveProperty("trip");
  });
  it("grants consent with timestamps and clears food on withdrawal", async () => {
    await rpc("consent", { purpose: "food", granted: true });
    expect(await rpc("step", { stage: "food", data: { allergies: "Peanuts" } })).toMatchObject({ food: { allergies: "Peanuts" } });
    const withdrawn = await rpc("consent", { purpose: "food", granted: false });
    expect(withdrawn).not.toHaveProperty("food");
    expect(withdrawn).toMatchObject({ consents: { food: { status: "withdrawn", version: "2026-09-v1", source: "profile-builder", granted_at: expect.any(String), withdrawn_at: expect.any(String) } } });
  });
  it("rejects food writes without consent inside the database", async () => {
    await expect(rpc("step", { stage: "food", data: { allergies: "Peanuts" } })).rejects.toThrow("Food consent required");
  });
  it("does not let a client-supplied identity alter another profile", async () => {
    await rpc("step", { stage: "trip", data: { area: "Windhoek" }, user_id: b });
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [b]);
    expect((await db.query("select travel_profile from public.profiles")).rows).toEqual([{ travel_profile: {} }]);
  });
  it("denies direct travel-profile writes that could forge consent", async () => {
    await expect(db.query("update public.profiles set travel_profile='{}' where id=$1", [a])).rejects.toThrow(/permission denied/);
  });
  it.each([
    { stage: "trip", data: { travellers: "0" } },
    { stage: "trip", data: { arrival: "2026-02-30" } },
    { stage: "trip", data: { arrival: "2026-10-02", departure: "2026-10-01" } },
    { stage: "preferences", data: { pace: "invalid" } },
    { stage: "interests", data: { selected: ["unknown"] } },
    { stage: "account", data: { language: "en" }, full_name: "x".repeat(201) },
  ])("validates data at the database boundary: %j", async (payload) => {
    await expect(rpc("step", payload)).rejects.toThrow();
  });
  it("makes favourite saves idempotent and enforces cross-user SELECT UPDATE DELETE", async () => {
    for (let i = 0; i < 2; i++) await db.query("insert into public.favourites (user_id,item_type,item_id) values ($1,'hotel','sample') on conflict (user_id,item_type,item_id) do nothing", [a]);
    expect((await db.query("select item_id from public.favourites")).rows).toHaveLength(1);
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [b]);
    expect((await db.query("select * from public.favourites")).rows).toHaveLength(0);
    expect((await db.query("update public.favourites set item_snapshot='{}' returning id")).rows).toHaveLength(0);
    expect((await db.query("delete from public.favourites returning id")).rows).toHaveLength(0);
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [a]);
    expect((await db.query("delete from public.favourites returning id")).rows).toHaveLength(1);
  });
  it("rejects inserting a favourite for another user", async () => {
    await expect(db.query("insert into public.favourites (user_id,item_type,item_id) values ($1,'hotel','sample')", [b])).rejects.toThrow(/row-level security/);
  });
  it("denies anonymous profile RPC execution", async () => {
    await db.exec("set local role anon");
    await expect(rpc("skip", { stage: "food" })).rejects.toThrow(/permission denied/);
  });
  it("denies authenticated calls with no user identity", async () => {
    await db.query("select set_config('request.jwt.claim.sub','',true)");
    await expect(rpc("skip", { stage: "food" })).rejects.toThrow(/Authentication required/);
  });
});
