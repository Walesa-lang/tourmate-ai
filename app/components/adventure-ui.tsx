import Link from "next/link";

export function ExpeditionIcon({ name, size = 22 }: { name: "compass" | "pin" | "spark" | "route" | "book" | "heart" | "shield" | "moon"; size?: number }) {
  const paths = {
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    spark: <><path d="m12 2 1.9 7.1L21 11l-7.1 1.9L12 20l-1.9-7.1L3 11l7.1-1.9L12 2Z" /><path d="m19 18 .5 1.5L21 20l-1.5.5L19 22l-.5-1.5L17 20l1.5-.5L19 18Z" /></>,
    route: <><circle cx="5" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 5h7a5 5 0 0 1 0 10H9a4 4 0 0 0 0 8h8" /></>,
    book: <><path d="M12 6c-2.7-1.8-6-2-9-1v14c3-1 6.3-.8 9 1 2.7-1.8 6-2 9-1V5c-3-1-6.3-.8-9 1Z" /><path d="M12 6v14" /></>,
    heart: <path d="M12 20.5 4.4 13A5.2 5.2 0 0 1 12 5.9 5.2 5.2 0 0 1 19.6 13L12 20.5Z" />,
    shield: <><path d="M12 2 4 5v6c0 5.1 3.3 8.8 8 11 4.7-2.2 8-5.9 8-11V5l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function AdventureFooter() {
  return <footer className="adventure-footer"><div className="container adventure-footer-inner"><div><Link href="/" className="adventure-footer-brand">TourMate <strong>AI</strong></Link><p>Discover Namibia with curiosity. Verify details before you travel.</p></div><nav aria-label="Footer navigation"><Link href="/explore">Explore</Link><Link href="/ai-guide">Assistant</Link><Link href="/hotels">Stays</Link><Link href="/attractions">Activities</Link><Link href="/partner/dashboard">Partners</Link></nav></div></footer>;
}

export function SectionHeading({ eyebrow, title, description, id }: { eyebrow: string; title: string; description?: string; id?: string }) {
  return <div className="adventure-section-heading"><span className="adventure-eyebrow">{eyebrow}</span><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div>;
}

export function ExpeditionLandscape() {
  return <svg className="expedition-landscape" viewBox="0 0 620 470" role="img" aria-label="Illustrated Namibia desert route at sunset">
    <defs><linearGradient id="expeditionSky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#142e3b" /><stop offset=".62" stopColor="#a66248" /><stop offset="1" stopColor="#f1b56e" /></linearGradient><linearGradient id="expeditionDune" x1="0" x2="1"><stop offset="0" stopColor="#955237" /><stop offset="1" stopColor="#d78950" /></linearGradient></defs>
    <rect width="620" height="470" rx="30" fill="url(#expeditionSky)" />
    <circle cx="435" cy="145" r="65" fill="#f6d091" opacity=".9" />
    <g fill="#f7e7c8" opacity=".9"><circle cx="62" cy="72" r="2"/><circle cx="141" cy="42" r="1.5"/><circle cx="195" cy="95" r="2"/><circle cx="330" cy="47" r="1.5"/><circle cx="524" cy="58" r="2"/><circle cx="558" cy="127" r="1.5"/></g>
    <path d="M0 305C100 248 192 274 267 315c92-79 205-79 353-20v175H0Z" fill="#bd7449" />
    <path d="M0 361c128-87 249-48 338-8 111-39 191-23 282 22v95H0Z" fill="url(#expeditionDune)" />
    <path d="M0 406c131-23 195 13 307 9 112-4 192-47 313-12v67H0Z" fill="#653d33" />
    <path d="M78 439c96-76 175 3 267-57s151-47 204-91" fill="none" stroke="#f8d6a4" strokeWidth="3" strokeDasharray="5 10" strokeLinecap="round" />
    <g fill="#f8d6a4" stroke="#542f2b" strokeWidth="3"><circle cx="78" cy="439" r="10"/><circle cx="345" cy="382" r="10"/><circle cx="549" cy="291" r="10"/></g>
    <path d="m83 220 17 20 17-20m-17 20v76" fill="none" stroke="#302d2c" strokeWidth="6" strokeLinecap="round" />
    <path d="m493 275 13-18 13 18m-13-18v51" fill="none" stroke="#44352d" strokeWidth="5" strokeLinecap="round" />
  </svg>;
}
