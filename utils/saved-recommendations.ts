import type { Recommendation } from "./ai-guide/catalogue";

// Display only bounded, known snapshot fields. Never fall back to database IDs.
export function displaySavedItems(value: unknown): Recommendation[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap(row => {
    if (!row || typeof row !== "object" || typeof row.item_id !== "string" || !["hotel", "attraction"].includes(row.item_type)) return [];
    const key = `${row.item_type}:${row.item_id}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const snapshot = row.item_snapshot && typeof row.item_snapshot === "object" ? row.item_snapshot : {};
    const text = (key: string, limit = 300) => typeof snapshot[key] === "string" ? snapshot[key].trim().slice(0, limit) : "";
    return [{ id: row.item_id, type: row.item_type, name: text("name", 200) || "Saved place", location: text("location", 120), category: text("category", 120), reason: text("reason"), ...(Number.isInteger(snapshot.day) && snapshot.day >= 1 && snapshot.day <= 14 ? { day: snapshot.day } : {}) }];
  });
}
