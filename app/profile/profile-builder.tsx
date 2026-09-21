"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { consentWording, fields, interests, purposes, stages, type StepData, type TravelProfile } from "@/utils/profile";

const titles = ["Essential account", "Trip context", "Interests", "Travel preferences", "Optional food preferences"];
export function ProfileBuilder() {
  const [profile, setProfile] = useState<TravelProfile>({});
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<StepData>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Loading your profile…");
  const [state, setState] = useState<"loading" | "ready" | "auth" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const stage = stages[step];

  async function restore(response: Response) {
    try {
      if (response.status === 401) { setState("auth"); return; }
      if (!response.ok) throw new Error();
      const data = await response.json();
      const saved = data.travel_profile as TravelProfile;
      const next = stages.findIndex((s) => !saved.completed?.includes(s));
      const index = next < 0 ? 0 : next;
      setProfile(saved); setName(data.full_name ?? ""); setEmail(data.email ?? "");
      setStep(index); setDraft(saved[stages[index]] ?? {}); setState("ready"); setStatus("Saved progress restored.");
    } catch { setState("error"); setStatus("Your profile could not be loaded. Please retry."); }
  }
  function loadFailed() { setState("error"); setStatus("Your profile could not be loaded. Please retry."); }
  function load() { return fetch("/api/profile", { cache: "no-store" }).then(restore).catch(loadFailed); }
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/profile", { cache: "no-store", signal: controller.signal }).then((response) => { if (!controller.signal.aborted) return restore(response); }).catch(() => { if (!controller.signal.aborted) loadFailed(); });
    return () => controller.abort();
  }, []);

  function selectStep(index: number, saved = profile) {
    setStep(index); setDraft(saved[stages[index]] ?? {}); setErrors({});
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function mutate(body: Record<string, unknown>, advance = false) {
    if (busy) return;
    setBusy(true); setErrors({}); setStatus("Saving…");
    try {
      const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (response.status === 401) { setState("auth"); return; }
      if (!response.ok) {
        setErrors(data.errors ?? {}); setStatus(data.error ?? "Could not save. Please retry.");
        return;
      }
      const saved = data.travel_profile as TravelProfile;
      setProfile(saved);
      if (body.action !== "consent" || (stage === "food" && body.purpose === "food" && !body.granted)) setDraft(saved[stage] ?? {});
      setStatus(body.action === "delete" ? "Optional information deleted." : body.action === "consent" ? "Consent updated. Withdrawal stops future use; withdrawing food consent also deletes food answers." : "Progress saved.");
      if (advance && step < stages.length - 1) selectStep(step + 1, saved);
    } catch { setStatus("Could not save. Your answers remain here; retry when connected."); }
    finally { setBusy(false); }
  }

  if (state === "loading") return <p role="status">Loading your profile…</p>;
  if (state === "auth") return <p>Sign in to save and manage your profile. <Link href="/sign-in?redirectTo=%2Fprofile">Sign in</Link> or <Link href="/ai-guide">continue with the Assistant</Link>.</p>;
  if (state === "error") return <div><p role="alert">{status}</p><button className="button" onClick={() => { setState("loading"); void load(); }}>Retry loading profile</button></div>;
  return <div className="profile-builder translation-managed">
    <p>{profile.completed?.length ?? 0} of 5 stages reviewed. Skipped stages count as reviewed.</p>
    <nav className="profile-steps" aria-label="Profile stages">{titles.map((title, index) => <button key={title} type="button" disabled={busy} aria-current={step === index ? "step" : undefined} onClick={() => selectStep(index)}>{index + 1}. {title}</button>)}</nav>
    <section className="dashboard-collection-card">
      <h2 ref={heading} tabIndex={-1}>{titles[step]}</h2>
      {stage === "account" && <p>Email: {email}. Email editing is not available here.</p>}
      {stage === "food" && <p>Confirm ingredients directly with the provider. Recipes and cross-contamination can change. TourMate cannot guarantee allergy safety or offer medical advice. Do not enter medical conditions.</p>}
      {stage === "food" && profile.consents?.food?.status !== "granted" && <p>To add food answers, first grant optional food consent below. You can also skip this stage.</p>}
      <form onSubmit={(event) => { event.preventDefault(); void mutate({ action: "step", stage, data: draft, ...(stage === "account" ? { full_name: name } : {}) }, true); }}>
        <fieldset disabled={busy || (stage === "food" && profile.consents?.food?.status !== "granted")}>
          <legend className="sr-only">{titles[step]}</legend>
          {stage === "account" && <label>Display name<input autoComplete="name" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} /></label>}
          {fields[stage].map((field) => <label key={field.key} htmlFor={`profile-${field.key}`}>{field.label}
            {field.options ? <select id={`profile-${field.key}`} value={String(draft[field.key] ?? "")} aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `error-${field.key}` : undefined} onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}><option value="">Skip / not specified</option>{field.options.map((v) => <option key={v}>{v}</option>)}</select>
              : <input id={`profile-${field.key}`} type={field.type ?? "text"} autoComplete={field.autocomplete ?? "off"} inputMode={field.type === "number" ? "numeric" : undefined} min={field.type === "number" ? 1 : field.type === "date" ? "2000-01-01" : undefined} max={field.type === "number" ? 100 : field.type === "date" ? "2100-12-31" : undefined} maxLength={field.max ?? 120} value={String(draft[field.key] ?? "")} aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `error-${field.key}` : undefined} onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })} />}
            {errors[field.key] && <span id={`error-${field.key}`} className="profile-error">{errors[field.key]}</span>}
          </label>)}
          {stage === "interests" && <div className="profile-interests">{interests.map((interest) => <label key={interest}><input type="checkbox" checked={Array.isArray(draft.selected) && draft.selected.includes(interest)} onChange={(e) => { const current = Array.isArray(draft.selected) ? draft.selected : []; setDraft({ ...draft, selected: e.target.checked ? [...current, interest] : current.filter((v) => v !== interest) }); }} />{interest}</label>)}</div>}
          <button className="button" type="submit">{busy ? "Saving…" : step < 4 ? "Save and continue" : "Save food preferences"}</button>
        </fieldset>
        {errors.form && <p role="alert">{errors.form}</p>}
      </form>
      {stage !== "account" && <div className="profile-actions"><button disabled={busy} onClick={() => mutate({ action: "skip", stage }, true)}>Skip this stage</button><button disabled={busy} onClick={() => mutate({ action: "delete", stage })}>Delete saved answers for this stage</button></div>}
    </section>
    <section className="dashboard-collection-card" aria-labelledby="consent-heading"><h2 id="consent-heading">Your consent and permissions</h2><p>These choices are optional and separate from device permissions. The Assistant works without a completed profile.</p>{purposes.map((purpose) => <label className="profile-consent" key={purpose}><input type="checkbox" checked={profile.consents?.[purpose]?.status === "granted"} disabled={busy || purpose === "location" || purpose === "safety"} onChange={(e) => mutate({ action: "consent", purpose, granted: e.target.checked })} /><span>{consentWording[purpose]} <small>{profile.consents?.[purpose]?.status ?? "Not granted"}</small></span></label>)}</section>
    <p role="status" aria-live="polite">{status}</p><p><Link href="/ai-guide">Ask the Assistant</Link> · <Link href="/dashboard">Profile & saved places</Link></p>
  </div>;
}
