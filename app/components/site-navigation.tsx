"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const navigationLinks = [
  ["/", "Home"], ["/explore", "Explore"], ["/ai-guide", "AI Guide"],
  ["/hotels", "Hotels"], ["/attractions", "Attractions"], ["/trip-planner", "Trip Planner"],
] as const;

function Brand() {
  return <Link className="brand" href="/" aria-label="TourMate AI home"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10.5" /><path d="M3.5 14h21M14 3.5c3 3.2 4.5 6.7 4.5 10.5S17 21.3 14 24.5c-3-3.2-4.5-6.7-4.5-10.5S11 6.7 14 3.5Z" /><path d="m17.8 7.7-2.3 5.8-5.8 2.3 2.3-5.8 5.8-2.3Z" /></svg></span><span>TourMate <strong>AI</strong></span></Link>;
}

export function SiteNavigation({ headerClassName }: { headerClassName: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const activeProps = (href: string) => pathname === href ? { className: "active", "aria-current": "page" as const } : {};
  const closeMenu = () => setIsOpen(false);

  return (
    <header className={headerClassName}>
      <nav className="nav container" aria-label="Main navigation">
        <Brand />
        <div className="nav-links">
          {navigationLinks.map(([href, label]) => <Link key={href} href={href} {...activeProps(href)}>{label}</Link>)}
        </div>
        <div className="nav-actions">
          <Link className="sign-in" href="/sign-in">Sign In</Link>
          <Link className="button button-small" href="/trip-planner">Plan a Trip <span aria-hidden="true">→</span></Link>
        </div>
        <button ref={toggleRef} className={`mobile-menu-toggle${isOpen ? " is-open" : ""}`} type="button" aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isOpen} aria-controls={menuId} onClick={() => setIsOpen((open) => !open)}>
          <span /><span /><span />
        </button>
        <div id={menuId} className={`mobile-menu${isOpen ? " is-open" : ""}`}>
          <div className="mobile-menu-links">
            {navigationLinks.map(([href, label]) => <Link key={href} href={href} onClick={closeMenu} {...activeProps(href)}>{label}</Link>)}
          </div>
          <div className="mobile-menu-actions">
            <Link className="mobile-sign-in" href="/sign-in" onClick={closeMenu}>Sign In</Link>
            <Link className="button mobile-plan-trip" href="/trip-planner" onClick={closeMenu}>Plan a Trip <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
