"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Recommendation } from "@/utils/ai-guide/catalogue";

export function SaveRecommendation({ item, initiallySaved = false, onRemoved }: { item: Recommendation; initiallySaved?: boolean; onRemoved?: () => void }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [auth, setAuth] = useState(false);
  const router = useRouter();
  async function toggle() {
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: saved ? "remove" : "save", id: item.id, type: item.type, day: item.day }) });
      if (response.status === 401) { setAuth(true); setStatus("Sign in to save this suggestion."); return; }
      if (!response.ok) throw new Error();
      setSaved(!saved); setStatus(saved ? "Removed from saved places." : "Saved to Profile & saved places.");
      if (saved) onRemoved?.();
      router.refresh();
    } catch { setStatus("Could not update saved places. Please retry."); }
    finally { setBusy(false); }
  }
  return <div className="recommendation-save translation-managed"><button type="button" disabled={busy} aria-pressed={saved} onClick={toggle}>{busy ? "Saving…" : saved ? `Remove ${item.name}` : `Save ${item.name}`}</button><span role="status">{status}</span>{auth && <Link href="/sign-in?redirectTo=%2Fai-guide">Sign in</Link>}</div>;
}

export function SavedRecommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [status, setStatus] = useState("Loading saved recommendations…");
  const [failed, setFailed] = useState(false);
  async function restore(response: Response) {
    try {
      if (!response.ok) throw new Error();
      const data = await response.json();
      setFailed(false);
      setItems(data.items.map((v: { item_type: "hotel" | "attraction"; item_id: string; item_snapshot: Partial<Recommendation> }) => ({ ...v.item_snapshot, type: v.item_type, id: v.item_id, name: v.item_snapshot.name ?? v.item_id, reason: v.item_snapshot.reason ?? "Saved from the illustrative catalogue." })));
      setStatus(data.items.length ? "Saved places loaded." : "No saved recommendations yet. Ask the Assistant for ideas.");
    } catch { setFailed(true); setStatus("Could not load saved places. Sign in or retry."); }
  }
  function loadFailed() { setFailed(true); setStatus("Could not load saved places. Sign in or retry."); }
  function load() { return fetch("/api/saved", { cache: "no-store" }).then(restore).catch(loadFailed); }
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/saved", { cache: "no-store", signal: controller.signal }).then((response) => { if (!controller.signal.aborted) return restore(response); }).catch(() => { if (!controller.signal.aborted) loadFailed(); });
    return () => controller.abort();
  }, []);
  return <section className="dashboard-collection-card translation-managed"><h2>Saved recommendations & itinerary items</h2><p>Selected suggestions, not confirmed bookings. Saved items also appear in your favourite hotels and attractions.</p><p role="status">{status}</p>{failed && <button onClick={load}>Retry saved places</button>}{items.map((item) => <article className="saved-recommendation" key={`${item.type}-${item.id}`}><h3>{item.name}</h3><p>{item.location}{item.day ? ` · Suggested day ${item.day}` : ""}</p><p>{item.reason}</p><Link href={item.type === "hotel" ? "/hotels" : "/attractions"}>Revisit catalogue</Link><SaveRecommendation item={item} initiallySaved onRemoved={() => { setItems((current) => current.filter((r) => r.id !== item.id || r.type !== item.type)); setStatus("Removed from saved places."); }} /></article>)}</section>;
}
