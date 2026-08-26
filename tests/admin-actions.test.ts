import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/supabase/admin", () => ({ requireAdmin: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { revalidatePath } from "next/cache";
import { reviewApplication } from "@/app/admin/actions";
import { initialReviewState } from "@/app/admin/review";
import { requireAdmin } from "@/utils/supabase/admin";

const applicationId = "123e4567-e89b-42d3-a456-426614174000";
const rpc = vi.fn();

function reviewForm(decision: string, reason = "", note = "") {
  const form = new FormData();
  form.set("application_id", applicationId);
  form.set("decision", decision);
  form.set("rejection_reason", reason);
  form.set("internal_admin_note", note);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAdmin).mockResolvedValue({ supabase: { rpc } as never, user: { id: "admin-id" } as never });
});

describe("admin review server action", () => {
  it("re-authorizes server-side and records an approval through the transactional RPC", async () => {
    rpc.mockResolvedValue({ data: [{ application_id: applicationId, application_status: "approved" }], error: null });
    const result = await reviewApplication(initialReviewState, reviewForm("approved", "ignored", "Looks good"));
    expect(requireAdmin).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("review_business_application", {
      p_application_id: applicationId, p_decision: "approved", p_rejection_reason: null, p_internal_admin_note: "Looks good",
    });
    expect(result).toEqual({ type: "success", message: "Application approved successfully." });
    expect(revalidatePath).toHaveBeenCalledWith("/partner/dashboard");
  });

  it("requires a rejection reason before authorization or mutation", async () => {
    const result = await reviewApplication(initialReviewState, reviewForm("rejected"));
    expect(result).toEqual({ type: "error", message: "Enter a rejection reason before rejecting this application." });
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("trims and submits a valid rejection reason and optional note", async () => {
    rpc.mockResolvedValue({ data: [{ application_id: applicationId, application_status: "rejected" }], error: null });
    const result = await reviewApplication(initialReviewState, reviewForm("rejected", "  Missing permit  ", "  Verify on resubmission  "));
    expect(rpc).toHaveBeenCalledWith("review_business_application", expect.objectContaining({ p_decision: "rejected", p_rejection_reason: "Missing permit", p_internal_admin_note: "Verify on resubmission" }));
    expect(result.type).toBe("success");
  });

  it("reports invalid or duplicate transitions without claiming success", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "23514", message: "Application is missing or is no longer pending." } });
    const result = await reviewApplication(initialReviewState, reviewForm("approved"));
    expect(result).toEqual({ type: "error", message: "This application is no longer pending. No duplicate decision was recorded." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
