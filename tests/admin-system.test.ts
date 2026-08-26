import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAdminFilter, validateReview } from "@/app/admin/review";
import { translations } from "@/app/i18n/translations";

const migration = readFileSync("supabase/migrations/20260826114833_add_partner_admin_review.sql", "utf8");
const authorization = readFileSync("utils/supabase/admin.ts", "utf8");
const adminPage = readFileSync("app/admin/page.tsx", "utf8");
const detailPage = readFileSync("app/admin/applications/[id]/page.tsx", "utf8");
const actions = readFileSync("app/admin/actions.ts", "utf8");

describe("admin authorization", () => {
  it("verifies both the authenticated identity and database-managed admin membership server-side", () => {
    expect(authorization).toContain("supabase.auth.getUser()");
    expect(authorization).toContain('.from("admin_users")');
    expect(authorization).toContain('.eq("user_id", user.id)');
    expect(authorization).not.toMatch(/@.*\.(com|org|net)/);
    expect(adminPage).toContain("await requireAdmin()");
    expect(detailPage).toContain("await requireAdmin()");
    expect(actions.match(/await requireAdmin\(\)/g)).toHaveLength(2);
  });

  it("locks admin membership and application review access behind RLS and narrow grants", () => {
    expect(migration).toContain("alter table public.admin_users enable row level security");
    expect(migration).toContain("revoke all on table public.admin_users from public, anon, authenticated");
    expect(migration).toContain('create policy "Admins can read all business applications"');
    expect(migration).toContain('create policy "Admins can read application reviews"');
    expect(migration).toContain("revoke all on table public.business_application_reviews from public, anon, authenticated");
    expect(migration).toContain("grant execute on function public.review_business_application(uuid, text, text, text) to authenticated");
    const businessAlter = migration.match(/alter table public\.businesses[\s\S]*?create index businesses_status_created_at_idx/)?.[0] ?? "";
    expect(businessAlter).not.toContain("internal_admin_note");
    expect(migration).toContain("Only administrators can review partner applications.");
  });
});

describe("partner application administration", () => {
  it("supports safe filters with pending as the default", () => {
    expect(parseAdminFilter(undefined)).toBe("pending");
    expect(parseAdminFilter("all")).toBe("all");
    expect(parseAdminFilter("approved")).toBe("approved");
    expect(parseAdminFilter("anything-else")).toBe("pending");
    expect(adminPage).toContain('.eq("status", filter)');
  });

  it("validates approval and rejection input", () => {
    expect(validateReview("approved", "ignored", "  useful note  ")).toEqual({ ok: true, decision: "approved", rejectionReason: null, internalNote: "useful note" });
    expect(validateReview("rejected", "  Missing licence  ", "")).toEqual({ ok: true, decision: "rejected", rejectionReason: "Missing licence", internalNote: null });
    expect(validateReview("rejected", "", "")).toEqual({ ok: false, error: "Enter a rejection reason before rejecting this application." });
    expect(validateReview("pending", "", "")).toEqual({ ok: false, error: "Choose approve or reject." });
  });

  it("prevents duplicate decisions, invalid transitions, and partner changes to protected review fields", () => {
    expect(actions).toContain('.rpc("review_business_application"');
    expect(migration).toContain("where id = p_application_id and status = 'pending'");
    expect(migration).toContain("old.status <> 'pending' or new.status not in ('approved', 'rejected')");
    expect(migration).toContain("new.reviewed_by := (select auth.uid())");
    expect(migration).toContain("new.reviewed_at := now()");
    const originalMigration = readFileSync("supabase/migrations/20260817090000_create_business_partner_applications.sql", "utf8");
    const ownerGrant = originalMigration.match(/grant update \(([\s\S]*?)\) on table public\.businesses to authenticated;/)?.[1] ?? "";
    expect(ownerGrant).not.toMatch(/status|rejection_reason|internal_admin_note|reviewed_by|reviewed_at/);
  });

  it("lists required applicant fields and shows complete application details", () => {
    for (const field of ["contact_name", "business_name", "business_type", "contact_email", "phone", "created_at", "status"]) expect(adminPage).toContain(field);
    for (const field of ["description", "country", "city", "website_url", "rejection_reason", "business_application_reviews", "internal_admin_note", "reviewed_at"]) expect(detailPage).toContain(field);
  });
});

describe("partner decision presentation", () => {
  const dashboard = readFileSync("app/partner/dashboard/page.tsx", "utf8");

  it("presents pending, approved, and rejected experiences without exposing internal notes", () => {
    expect(dashboard).toContain('business.status === "pending"');
    expect(dashboard).toContain('business.status === "approved"');
    expect(dashboard).toContain('business.status === "rejected"');
    expect(dashboard).toContain("business.rejection_reason");
    expect(dashboard).not.toContain("business.internal_admin_note");
  });

  it("translates every new partner-facing message in all five languages", () => {
    for (const key of ["Application approved", "Next onboarding step", "Application decision", "Reason from the review team", "Review the reason above and contact our partner team if you need help correcting your information or requesting a new application."]) {
      for (const language of ["en", "fr", "es", "pt", "zh"] as const) expect(translations[language][key]).toBeTruthy();
    }
  });
});
