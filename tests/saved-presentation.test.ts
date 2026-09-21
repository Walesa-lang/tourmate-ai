import { describe, expect, it } from "vitest";
import { displaySavedItems } from "../utils/saved-recommendations";

describe("saved recommendation presentation", () => {
  it("deduplicates by type and identifier while preserving genuine context", () => {
    const row = { item_id: "one", item_type: "hotel", item_snapshot: { name: "Garden stay", location: "Windhoek", reason: "Selected from an itinerary.", day: 2 } };
    expect(displaySavedItems([row, row])).toEqual([{ id: "one", type: "hotel", name: "Garden stay", location: "Windhoek", reason: "Selected from an itinerary.", day: 2, category: "" }]);
  });
  it("never displays identifiers or arbitrary snapshot objects as titles", () => {
    expect(displaySavedItems([{ item_id: "private-id", item_type: "hotel", item_snapshot: { name: { secret: true }, day: 99 } }])[0]).toEqual({ id: "private-id", type: "hotel", name: "Saved place", location: "", category: "", reason: "" });
    expect(displaySavedItems([null, {}, { item_id: "x", item_type: "unknown" }])).toEqual([]);
  });
  it("bounds long display text and tolerates invalid collections", () => {
    expect(displaySavedItems(null)).toEqual([]);
    expect(displaySavedItems([{ item_id: "x", item_type: "attraction", item_snapshot: { name: "a".repeat(500) } }])[0].name).toHaveLength(200);
  });
});
