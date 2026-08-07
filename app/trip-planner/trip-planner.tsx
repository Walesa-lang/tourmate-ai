"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Json } from "@/utils/supabase/database.types";

const interests = ["Adventure", "Wildlife", "Culture", "Food", "Beaches", "Nature", "Relaxation"];
const itinerary = [
  { day: 1, place: "Windhoek", title: "A warm Namibian welcome", text: "Settle in, explore the city centre, and enjoy a relaxed first dinner.", activities: ["Craft Centre", "Independence Museum", "Namibian tasting menu"], stay: "The Weinberg Windhoek · Comfort", transport: "Airport transfer and local taxi" },
  { day: 2, place: "Sossusvlei", title: "Into the Namib Desert", text: "Travel south through changing landscapes and arrive before sunset.", activities: ["Scenic road trip", "Sesriem Canyon", "Desert sundowner"], stay: "Desert Quiver Camp · Comfort", transport: "4×4 rental · approximately 5 hours" },
  { day: 3, place: "Sossusvlei", title: "Dunes at golden hour", text: "Start before sunrise for Namibia's iconic dunes and ancient clay pan.", activities: ["Dune 45 sunrise", "Deadvlei walk", "Guided nature drive"], stay: "Desert Quiver Camp · Comfort", transport: "4×4 and park shuttle" },
  { day: 4, place: "Swakopmund", title: "Desert meets Atlantic", text: "Cross the Namib to a breezy coastal town with time to explore.", activities: ["Walvis Bay lagoon", "Waterfront walk", "Local seafood dinner"], stay: "Swakopmund Sands · Comfort", transport: "Self-drive · approximately 5 hours" },
  { day: 5, place: "Etosha National Park", title: "Wildlife on the horizon", text: "Head north for an afternoon game drive around Etosha's waterholes.", activities: ["Game drive", "Okaukuejo waterhole", "Sunset wildlife viewing"], stay: "Etosha Safari Camp · Comfort", transport: "4×4 self-drive · approximately 5 hours" },
];
type Errors = Partial<Record<"destination" | "startDate" | "endDate" | "travellers" | "interests", string>>;
type TripDetails = {
  destination: string;
  startDate: string;
  endDate: string;
  travellers: number;
  budget: string;
  pace: string;
};
type SaveStatus = "idle" | "saving" | "saved" | "auth-error" | "database-error";

export default function TripPlanner() {
  const router = useRouter();
  const [selected, setSelected] = useState(["Wildlife", "Nature"]);
  const [status, setStatus] = useState<"empty" | "loading" | "generated">("empty");
  const [errors, setErrors] = useState<Errors>({});
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const formRef = useRef<HTMLFormElement>(null);

  function toggleInterest(interest: string) {
    setSelected((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextErrors: Errors = {};
    const startDate = String(data.get("startDate") || "");
    const endDate = String(data.get("endDate") || "");
    if (!data.get("destination")) nextErrors.destination = "Choose a destination to continue.";
    if (!startDate) nextErrors.startDate = "Add your trip start date.";
    if (!endDate) nextErrors.endDate = "Add your trip end date.";
    if (startDate && endDate && endDate < startDate) nextErrors.endDate = "End date must be on or after the start date.";
    if (!data.get("travellers")) nextErrors.travellers = "Tell us how many people are travelling.";
    if (!selected.length) nextErrors.interests = "Choose at least one travel interest.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setStatus("loading");
    setTripDetails({
      destination: String(data.get("destination")),
      startDate,
      endDate,
      travellers: Number(data.get("travellers")),
      budget: String(data.get("budget")),
      pace: String(data.get("pace")),
    });
    setSaveStatus("idle");
    window.setTimeout(() => {
      setStatus("generated");
      window.setTimeout(() => document.getElementById("trip-preview")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }, 900);
  }
  function editTrip() {
    setStatus("empty");
    setSaveStatus("idle");
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function saveTrip() {
    if (!tripDetails || saveStatus === "saving" || saveStatus === "saved") return;

    setSaveStatus("saving");
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      setSaveStatus("auth-error");
      window.setTimeout(() => router.push("/sign-in?redirectTo=%2Ftrip-planner"), 900);
      return;
    }

    const itinerarySnapshot: Json = {
      days: itinerary,
      summary: {
        estimatedBudget: "N$ 43,500",
        bestFor: "Nature & wildlife",
        transport: "4x4 self-drive",
      },
    };
    const { error } = await supabase.from("saved_trips").insert({
      user_id: user.id,
      title: "Namibia Desert & Wildlife Escape",
      destination: tripDetails.destination,
      start_date: tripDetails.startDate,
      end_date: tripDetails.endDate,
      travellers: tripDetails.travellers,
      budget: tripDetails.budget.toLowerCase(),
      interests: selected,
      pace: tripDetails.pace.toLowerCase(),
      itinerary: itinerarySnapshot,
    });

    setSaveStatus(error ? "database-error" : "saved");
  }

  return (
    <section className="planner-workspace" aria-label="Build your trip">
      <div className="container planner-layout">
        <form className="planner-form-card" id="planner-form" ref={formRef} onSubmit={handleSubmit} noValidate>
          <div className="form-heading">
            <span>Step 1 of 3</span><h2>Tell us about your trip</h2>
            <p>Fields marked <span aria-hidden="true">*</span><span className="sr-only">required</span> are required.</p>
          </div>
          <div className="planner-fields">
            <div className="planner-field field-wide">
              <label htmlFor="trip-destination">Destination <span>*</span></label>
              <select id="trip-destination" name="destination" defaultValue="Namibia" aria-invalid={!!errors.destination} aria-describedby={errors.destination ? "destination-error" : undefined} required>
                <option value="">Select a destination</option><option>Namibia</option>
              </select>
              <small>More countries are coming soon.</small>
              {errors.destination && <p className="field-error" id="destination-error">{errors.destination}</p>}
            </div>
            <div className="planner-field">
              <label htmlFor="start-date">Start date <span>*</span></label>
              <input id="start-date" name="startDate" type="date" aria-invalid={!!errors.startDate} aria-describedby={errors.startDate ? "start-error" : undefined} required />
              {errors.startDate && <p className="field-error" id="start-error">{errors.startDate}</p>}
            </div>
            <div className="planner-field">
              <label htmlFor="end-date">End date <span>*</span></label>
              <input id="end-date" name="endDate" type="date" aria-invalid={!!errors.endDate} aria-describedby={errors.endDate ? "end-error" : undefined} required />
              {errors.endDate && <p className="field-error" id="end-error">{errors.endDate}</p>}
            </div>
            <div className="planner-field field-wide">
              <label htmlFor="travellers">Number of travellers <span>*</span></label>
              <select id="travellers" name="travellers" defaultValue="2" aria-invalid={!!errors.travellers} aria-describedby={errors.travellers ? "travellers-error" : undefined} required>
                <option value="">Select travellers</option>
                {[1, 2, 3, 4, 5, 6].map((number) => <option key={number} value={number}>{number} {number === 1 ? "traveller" : "travellers"}</option>)}
              </select>
              {errors.travellers && <p className="field-error" id="travellers-error">{errors.travellers}</p>}
            </div>
          </div>
          <fieldset className="choice-group">
            <legend>Budget level <span>*</span></legend>
            <div className="segmented-options">{["Budget", "Comfort", "Luxury"].map((option) => <label key={option}><input type="radio" name="budget" value={option} defaultChecked={option === "Comfort"} /><span>{option}</span></label>)}</div>
          </fieldset>
          <fieldset className="choice-group">
            <legend>Travel interests <span>*</span></legend><p>Choose all that sound like you.</p>
            <div className="interest-grid">{interests.map((interest) => <label key={interest}><input type="checkbox" checked={selected.includes(interest)} onChange={() => toggleInterest(interest)} /><span>{interest}</span></label>)}</div>
            {errors.interests && <p className="field-error" role="alert">{errors.interests}</p>}
          </fieldset>
          <fieldset className="choice-group">
            <legend>Travel pace <span>*</span></legend>
            <div className="pace-options">{[["Relaxed", "More free time"], ["Balanced", "A comfortable mix"], ["Packed", "See more each day"]].map(([title, description]) => <label key={title}><input type="radio" name="pace" value={title} defaultChecked={title === "Balanced"} /><span><strong>{title}</strong><small>{description}</small></span></label>)}</div>
          </fieldset>
          <button className="button planner-submit" type="submit" disabled={status === "loading"}><span aria-hidden="true">✦</span> Generate My Trip</button>
          <p className="prototype-note">Prototype preview — no booking or payment required.</p>
        </form>

        <aside className="planner-state-card" id="trip-preview" aria-live="polite" aria-busy={status === "loading"}>
          {status === "empty" && <div className="empty-state"><div className="empty-state-icon" aria-hidden="true">⌁</div><span>Your itinerary preview</span><h2>Your Namibia adventure starts here</h2><p>Complete the details and we&apos;ll turn your travel style into a day-by-day plan.</p><ul><li>Personalized route</li><li>Estimated budget</li><li>Stays and transport</li></ul></div>}
          {status === "loading" && <div className="loading-state" role="status"><div className="planner-spinner" aria-hidden="true" /><h2>Designing your trip…</h2><p>Balancing distances, memorable stops, and time to breathe.</p><div className="skeleton-lines" aria-hidden="true"><span /><span /><span /></div></div>}
          {status === "generated" && (
            <div className="generated-state">
              <header className="itinerary-header"><div><span>Your personalized trip</span><h2>Namibia Desert &amp; Wildlife Escape</h2><p>5 days · 2 travellers · Comfort · Balanced pace</p></div><span className="ready-badge">✓ Ready</span></header>
              <div className="summary-grid"><div><span>Estimated budget</span><strong>N$ 43,500</strong><small>for 2 travellers</small></div><div><span>Best for</span><strong>Nature &amp; wildlife</strong><small>with a little adventure</small></div><div><span>Transport</span><strong>4×4 self-drive</strong><small>Airport pickup included</small></div></div>
              <div className="itinerary-days">{itinerary.map((item) => <article className="itinerary-day" key={item.day}><div className="day-marker"><span>Day</span><strong>{item.day}</strong></div><div className="day-content"><span className="day-place">{item.place}</span><h3>{item.title}</h3><p>{item.text}</p><div className="activity-tags">{item.activities.map((activity) => <span key={activity}>{activity}</span>)}</div><dl><div><dt>Stay</dt><dd>{item.stay}</dd></div><div><dt>Getting around</dt><dd>{item.transport}</dd></div></dl></div></article>)}</div>
              <div className="itinerary-actions"><button className="secondary-button" type="button" onClick={editTrip}>Edit trip</button><button className="button" type="button" onClick={saveTrip} disabled={saveStatus === "saving" || saveStatus === "saved"}>{saveStatus === "saving" ? "Saving trip…" : saveStatus === "saved" ? "Trip saved" : "Save trip"}</button></div>
              {saveStatus === "saving" && <p className="save-message" role="status">Saving your trip…</p>}
              {saveStatus === "saved" && <p className="save-message save-message-success" role="status">Trip saved successfully. View it on your Dashboard.</p>}
              {saveStatus === "auth-error" && <p className="save-message save-message-error" role="alert">Sign in to save this trip. Taking you to sign in…</p>}
              {saveStatus === "database-error" && <p className="save-message save-message-error" role="alert">We could not save your trip. Please try again.</p>}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
