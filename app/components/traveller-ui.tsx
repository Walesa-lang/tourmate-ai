import Link from "next/link";
import type { ReactNode } from "react";

export function TravelIcon({ name = "compass" }: { name?: "compass" | "stay" | "profile" | "shield" }) {
  return <svg className="travel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    {name === "stay" ? <path d="M4 21V4h16v17M4 14h16M8 9h2m4 0h2M9 21v-4h6v4" /> : name === "profile" ? <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></> : name === "shield" ? <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6" /> : <><circle cx="12" cy="12" r="9" /><path d="m16 8-2 6-6 2 2-6 6-2Z" /></>}
  </svg>;
}
export function SectionHeading({ title, eyebrow, id, children }: { title: string; eyebrow?: string; id?: string; children?: ReactNode }) {
  return <div className="traveller-section-heading"><div>{eyebrow && <p className="traveller-eyebrow">{eyebrow}</p>}<h2 id={id}>{title}</h2></div>{children}</div>;
}
export function EmptyState({ title, children, href, action, headingLevel = 3 }: { title: string; children: ReactNode; href: string; action: string; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return <div className="traveller-empty"><span className="traveller-icon-tile"><TravelIcon /></span><Heading>{title}</Heading><p>{children}</p><Link className="traveller-button-secondary" href={href}>{action}<span aria-hidden="true">→</span></Link></div>;
}
export function LoadingCards() {
  return <div role="status"><span className="sr-only">Loading saved recommendations…</span><div className="saved-grid" aria-hidden="true">{[0, 1].map(i => <div className="saved-card saved-skeleton" key={i}><span /><span /><span /></div>)}</div></div>;
}
