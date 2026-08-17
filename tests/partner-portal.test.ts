import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateBusinessApplication, type BusinessFormValues } from "@/app/partner/business";

const valid: BusinessFormValues = {
  business_name: "Desert Trails", business_type: "tour_operator", description: "Small-group desert tours.", country: "Namibia", city: "Windhoek",
  contact_name: "Amina N.", contact_email: "partners@example.com", phone: "+264 61 000 000", website_url: "https://example.com", agreement: true,
};

describe("partner application validation", () => {
  it("rejects every incomplete required field", () => {
    const errors = validateBusinessApplication({ business_name: "", business_type: "" as BusinessFormValues["business_type"], description: "", country: "", city: "", contact_name: "", contact_email: "", phone: "", website_url: "", agreement: false });
    expect(Object.keys(errors).sort()).toEqual(["agreement", "business_name", "business_type", "city", "contact_email", "contact_name", "country", "description", "phone"]);
  });

  it("validates email and optional URL without rejecting an omitted URL", () => {
    expect(validateBusinessApplication({ ...valid, website_url: "" })).toEqual({});
    expect(validateBusinessApplication({ ...valid, contact_email: "not-an-email", website_url: "social.example" })).toMatchObject({ contact_email: expect.any(String), website_url: expect.any(String) });
  });
});

describe("partner portal security assumptions", () => {
  const migration = readFileSync("supabase/migrations/20260817090000_create_business_partner_applications.sql", "utf8");

  it("protects both partner routes and preserves their return URLs", () => {
    const apply = readFileSync("app/partner/apply/page.tsx", "utf8");
    const dashboard = readFileSync("app/partner/dashboard/page.tsx", "utf8");
    expect(apply).toContain('supabase.auth.getUser()');
    expect(apply).toContain('/sign-in?redirectTo=%2Fpartner%2Fapply');
    expect(dashboard).toContain('supabase.auth.getUser()');
    expect(dashboard).toContain('/sign-in?redirectTo=%2Fpartner%2Fdashboard');
  });

  it("prevents duplicate applications at both UI and database layers", () => {
    const page = readFileSync("app/partner/apply/page.tsx", "utf8");
    const form = readFileSync("app/partner/apply/partner-application-form.tsx", "utf8");
    expect(migration).toContain("constraint businesses_owner_unique unique (owner_id)");
    expect(page).toContain('redirect("/partner/dashboard")');
    expect(form).toContain('error.code === "23505"');
  });

  it("limits RLS to the owner, pending updates, and immutable review fields", () => {
    expect(migration).toContain("with check ((select auth.uid()) = owner_id and status = 'pending')");
    expect(migration).toContain("using ((select auth.uid()) = owner_id and status = 'pending')");
    expect(migration).toContain("revoke all on table public.businesses from public, anon, authenticated");
    const ownerGrant = migration.match(/grant update \(([\s\S]*?)\) on table public\.businesses to authenticated;/)?.[1] ?? "";
    expect(ownerGrant).not.toContain("status");
    expect(ownerGrant).not.toContain("owner_id");
  });

  it("defines the required responsive breakpoints and mobile touch targets", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toContain("@media (max-width: 768px)");
    expect(css).toContain("@media (max-width: 520px)");
    expect(css).toContain(".partner-agreement input { width: 44px; height: 44px;");
    expect(css).toContain(".partner-submit { min-width: 210px; min-height: 50px;");
  });
});
