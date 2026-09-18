import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardContent } from "@/app/dashboard/dashboard-content";

type Props = Parameters<typeof DashboardContent>[0];
const base: Props = {
  fullName: "",
  email: "traveller@example.com",
  greetingName: "Traveller",
  plan: "free",
  savedTrips: [],
  favourites: [],
};

describe("My Namibia Journey", () => {
  it("starts with no earned discovery stamps and points to real next actions", () => {
    const html = renderToStaticMarkup(<DashboardContent {...base} />);
    expect(html).toContain("My Namibia Journey");
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain("0 of 2 discovery types saved");
    expect(html).toContain("Explore stays");
    expect(html).toContain("Explore activities");
    expect(html).toContain("current browser tab");
  });

  it("counts saved stay and activity types once each", () => {
    const favourites: Props["favourites"] = [
      { id: "stay-1", item_type: "hotel", item_id: "stay-1", item_snapshot: { name: "Sample stay" }, created_at: "2026-01-01" },
      { id: "stay-2", item_type: "hotel", item_id: "stay-2", item_snapshot: { name: "Second stay" }, created_at: "2026-01-01" },
      { id: "activity-1", item_type: "attraction", item_id: "activity-1", item_snapshot: { name: "Sample activity" }, created_at: "2026-01-01" },
    ];
    const html = renderToStaticMarkup(<DashboardContent {...base} favourites={favourites} />);
    expect(html).toContain('aria-valuenow="2"');
    expect(html).toContain("2 of 2 discovery types saved");
    expect(html).toContain("Favourite hotels</p>");
    expect(html).toContain("Favourite attractions</p>");
  });
});
