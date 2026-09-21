"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Recommendation } from "@/utils/ai-guide/catalogue";
import { displaySavedItems } from "@/utils/saved-recommendations";
import { EmptyState, LoadingCards, SectionHeading, TravelIcon } from "./traveller-ui";

export function SaveRecommendation({ item, initiallySaved = false, onRemoved, confirmRemoval = false }: { item: Recommendation; initiallySaved?: boolean; onRemoved?: () => void; confirmRemoval?: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [auth, setAuth] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => { if (confirming) cancel.current?.focus(); }, [confirming]);
  function keep() { setConfirming(false); trigger.current?.focus(); }
  async function toggle() {
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: saved ? "remove" : "save", id: item.id, type: item.type, day: item.day }) });
      if (response.status === 401) { setAuth(true); setStatus("Sign in to manage saved suggestions."); return; }
      if (!response.ok) throw new Error();
      setSaved(!saved); setConfirming(false); setStatus(saved ? "Removed from saved places." : "Saved to Profile & saved places.");
      if (saved) onRemoved?.();
      router.refresh();
    } catch { setStatus("Could not update saved places. Please retry."); }
    finally { setBusy(false); }
  }
  return <div className="recommendation-save translation-managed">
    <button ref={trigger} className={saved ? "traveller-button-quiet" : "traveller-button-secondary"} type="button" disabled={busy} aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${item.name}`} onClick={() => saved && confirmRemoval ? setConfirming(true) : void toggle()}>{busy ? "Saving…" : saved ? "Remove" : "Save suggestion"}</button>
    {confirming && <div className="removal-confirmation" onKeyDown={e => { if (e.key === "Escape") keep(); }}><p>Remove this from your saved places? You can save it again from the catalogue.</p><div><button ref={cancel} className="traveller-button-secondary" disabled={busy} onClick={keep}>Keep saved</button><button className="traveller-button-quiet" disabled={busy} aria-label={`Confirm removal of ${item.name}`} onClick={toggle}>Confirm removal</button></div></div>}
    <span className="traveller-status" role="status">{status}</span>
    {auth && <Link href={`/sign-in?redirectTo=${encodeURIComponent(pathname)}`}>Sign in</Link>}
  </div>;
}

export function SavedRecommendationCard({ item, onRemoved }: { item: Recommendation; onRemoved: () => void }) {
  return <article className="saved-recommendation saved-card">
    <div className="saved-card-category"><span className="traveller-icon-tile"><TravelIcon name={item.type === "hotel" ? "stay" : "compass"} /></span><span>{item.type === "hotel" ? "Stay" : "Activity"}{item.day ? ` · Day ${item.day} idea` : ""}</span></div>
    <h3>{item.name}</h3>{item.location && <p className="saved-card-location">{item.location}</p>}
    {item.reason && <p className="saved-card-reason">{item.reason}</p>}
    <p className="saved-card-disclosure">Illustrative catalogue · Confirm current details with the provider.</p>
    <div className="saved-card-actions"><Link className="traveller-button-secondary" href={item.type === "hotel" ? "/hotels" : "/attractions"}>View in catalogue <span aria-hidden="true">→</span></Link><SaveRecommendation item={item} initiallySaved confirmRemoval onRemoved={onRemoved} /></div>
  </article>;
}

export function SavedRecommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error" | "auth">("loading");
  const [status, setStatus] = useState("");
  const section = useRef<HTMLElement>(null);
  const focusAfterRemoval = useRef(false);
  useEffect(() => {
    if (!focusAfterRemoval.current) return;
    focusAfterRemoval.current = false;
    section.current?.querySelector<HTMLAnchorElement>(".saved-card a, .traveller-empty a")?.focus();
  }, [items]);
  async function restore(response: Response) {
    try {
      if (response.status === 401) { setState("auth"); return; }
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data.items)) throw new Error();
      setItems(displaySavedItems(data.items)); setState("ready");
    } catch { setState("error"); }
  }
  function load() { setState("loading"); return fetch("/api/saved", { cache: "no-store" }).then(restore).catch(() => setState("error")); }
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/saved", { cache: "no-store", signal: controller.signal }).then(response => { if (!controller.signal.aborted) return restore(response); }).catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  return <section ref={section} className="saved-places translation-managed" aria-labelledby="saved-places-title">
    <SectionHeading id="saved-places-title" title="Saved places & ideas" eyebrow="Your shortlist">{state === "ready" && items.length > 0 && <span className="traveller-count">{items.length} saved</span>}</SectionHeading>
    <p className="traveller-section-description">Places to stay, things to do, and itinerary ideas. These are suggestions, not confirmed bookings.</p>
    {state === "loading" && <LoadingCards />}
    {state === "error" && <div className="traveller-notice"><p role="alert">Could not load saved places. Please try again.</p><button className="traveller-button-secondary" onClick={load}>Retry saved places</button></div>}
    {state === "auth" && <EmptyState title="Your saved places are private" href="/sign-in?redirectTo=%2Fdashboard" action="Sign in">Sign in to see and manage your saved suggestions.</EmptyState>}
    {state === "ready" && (items.length ? <div className="saved-grid">{items.map(item => <SavedRecommendationCard item={item} key={`${item.type}:${item.id}`} onRemoved={() => {
      focusAfterRemoval.current = true;
      setItems(current => current.filter(r => r.id !== item.id || r.type !== item.type)); setStatus("Removed from saved places.");
    }} />)}</div> : <EmptyState title="Make room for a little inspiration" href="/ai-guide" action="Ask the Assistant">Save a place or an itinerary idea from the Assistant. Your favourites from Stays and Activities also belong here.</EmptyState>)}
    <p className="traveller-status" role="status">{status}</p>
  </section>;
}
