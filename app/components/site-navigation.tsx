"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { PARTNERS_NAV_LABEL } from "@/app/i18n/translations";
import { ExpeditionIcon } from "./adventure-ui";

const navigationLinks = [
  ["/explore", "Explore"], ["/hotels", "Stays"], ["/attractions", "Activities"],
  ["/partner/dashboard", PARTNERS_NAV_LABEL],
] as const;

function Brand() {
  return <Link className="brand" href="/" aria-label="TourMate AI home"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10.5" /><path d="M3.5 14h21M14 3.5c3 3.2 4.5 6.7 4.5 10.5S17 21.3 14 24.5c-3-3.2-4.5-6.7-4.5-10.5S11 6.7 14 3.5Z" /><path d="m17.8 7.7-2.3 5.8-5.8 2.3 2.3-5.8 5.8-2.3Z" /></svg></span><span>TourMate <strong>AI</strong></span></Link>;
}

export function SiteNavigation({ headerClassName }: { headerClassName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const menuId = useId();
  const accountMenuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      if (!session?.user) setIsAccountOpen(false);
      setIsAuthLoading(false);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      setUser(data.session?.user ?? null);
      setAuthError(error ? "Unable to check your session." : null);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!isOpen && !isAccountOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isAccountOpen) {
          setIsAccountOpen(false);
          accountButtonRef.current?.focus();
        } else {
          setIsOpen(false);
          toggleRef.current?.focus();
        }
      }
    }
    function handlePointerDown(event: PointerEvent) {
      if (isAccountOpen && !accountRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isAccountOpen, isOpen]);

  const activeProps = (href: string) => pathname === href ? { className: "active", "aria-current": "page" as const } : {};
  const closeMenu = () => setIsOpen(false);
  const userName = typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
    ? user.user_metadata.full_name.trim()
    : user?.email ?? "Account";
  const firstName = userName.includes("@") ? userName : userName.split(/\s+/)[0];
  const userEmail = user?.email ?? "Email unavailable";

  async function handleSignOut() {
    setIsSigningOut(true);
    setAuthError(null);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError("Unable to sign out. Please try again.");
      setIsSigningOut(false);
      return;
    }

    setUser(null);
    setIsSigningOut(false);
    setIsAccountOpen(false);
    closeMenu();
    router.push("/");
    router.refresh();
  }

  const savedHref = user ? "/dashboard#saved" : "/sign-in?redirectTo=%2Fdashboard";
  const profileHref = user ? "/dashboard" : "/sign-in?redirectTo=%2Fdashboard";

  return <>
    <header className={headerClassName}>
      <nav className="nav container" aria-label="Main navigation">
        <Brand />
        <div className="nav-links">
          {navigationLinks.map(([href, label]) => <Link key={href} href={href} {...activeProps(href)}>{href === "/partner/dashboard" ? <span className="nav-partners">{label}</span> : label}</Link>)}
          {user && <Link href="/dashboard" {...activeProps("/dashboard")}>Profile</Link>}
        </div>
        <div className="nav-actions">
          {isAuthLoading ? (
            <span className="nav-auth-loading" role="status"><span className="nav-auth-skeleton" aria-hidden="true" /><span className="sr-only">Checking sign-in status</span></span>
          ) : user ? (
            <div className="account-menu" ref={accountRef}>
              <button ref={accountButtonRef} className="account-menu-button" type="button" aria-label={`Open account menu for ${userName}`} aria-expanded={isAccountOpen} aria-controls={accountMenuId} aria-haspopup="menu" onClick={() => setIsAccountOpen((open) => !open)}>
                <span className="account-avatar" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" /></svg></span>
                <span className="account-greeting">Hi, {firstName}</span>
                <svg className="account-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
              </button>
              <div id={accountMenuId} className={`account-dropdown${isAccountOpen ? " is-open" : ""}`} role="menu" aria-label="Your account">
                <div className="account-details">
                  <span className="account-dropdown-avatar" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" /></svg></span>
                  <div><strong>{userName}</strong><span>{userEmail}</span></div>
                </div>
                <Link className="account-dashboard-link" href="/dashboard" role="menuitem" onClick={() => setIsAccountOpen(false)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" /></svg>
                  Profile & saved places
                </Link>
                <button className="account-sign-out" type="button" role="menuitem" onClick={handleSignOut} disabled={isSigningOut}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>
                  {isSigningOut ? "Signing out…" : "Sign Out"}
                </button>
                {authError && <p className="account-auth-error" role="alert">{authError}</p>}
              </div>
            </div>
          ) : (
            <Link className="sign-in" href="/sign-in">Sign In</Link>
          )}
          <Link className="button button-small" href="/ai-guide">Ask the Assistant <span aria-hidden="true">→</span></Link>
        </div>
        <button ref={toggleRef} className={`mobile-menu-toggle${isOpen ? " is-open" : ""}`} type="button" aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isOpen} aria-controls={menuId} onClick={() => setIsOpen((open) => !open)}>
          <span /><span /><span />
        </button>
        <div id={menuId} className={`mobile-menu${isOpen ? " is-open" : ""}`}>
          <div className="mobile-menu-links">
            {navigationLinks.map(([href, label]) => <Link key={href} href={href} onClick={closeMenu} {...activeProps(href)}>{label}</Link>)}
            {user && <Link href="/dashboard" onClick={closeMenu} {...activeProps("/dashboard")}>Profile</Link>}
          </div>
          {user && !isAuthLoading && (
            <section className="mobile-account" aria-labelledby={`${accountMenuId}-mobile-title`}>
              <p id={`${accountMenuId}-mobile-title`} className="mobile-account-label">Your account</p>
              <div className="mobile-account-identity">
                <span className="mobile-account-avatar" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" /></svg></span>
                <div><strong>{userName}</strong><span>{userEmail}</span></div>
              </div>
              <Link className="mobile-account-dashboard" href="/dashboard" onClick={closeMenu}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" /></svg>
                Profile & saved places
              </Link>
              <button className="mobile-account-sign-out" type="button" onClick={handleSignOut} disabled={isSigningOut}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>
                {isSigningOut ? "Signing out…" : "Sign Out"}
              </button>
            </section>
          )}
          <div className="mobile-menu-actions">
            {isAuthLoading ? (
              <span className="mobile-auth-loading" role="status"><span className="nav-auth-skeleton" aria-hidden="true" /><span className="sr-only">Checking sign-in status</span></span>
            ) : !user ? (
              <Link className="mobile-sign-in" href="/sign-in" onClick={closeMenu}>Sign In</Link>
            ) : null}
            <Link className="button mobile-plan-trip" href="/ai-guide" onClick={closeMenu}>Ask the Assistant <span aria-hidden="true">→</span></Link>
          </div>
          {authError && <p className="nav-auth-error" role="alert">{authError}</p>}
        </div>
      </nav>
    </header>
    <nav className="adventure-bottom-nav" aria-label="Quick navigation">
      <Link href="/" aria-current={pathname === "/" ? "page" : undefined}><ExpeditionIcon name="compass" /><span>Home</span></Link>
      <Link href="/explore" aria-current={pathname === "/explore" ? "page" : undefined}><ExpeditionIcon name="pin" /><span>Explore</span></Link>
      <Link className="bottom-guide-link" href="/ai-guide" aria-current={pathname === "/ai-guide" ? "page" : undefined}><ExpeditionIcon name="spark" size={25} /><span>Guide</span></Link>
      <Link href={savedHref}><ExpeditionIcon name="heart" /><span>Saved</span></Link>
      <Link href={profileHref} aria-current={pathname === "/dashboard" ? "page" : undefined}><ExpeditionIcon name="book" /><span>Profile</span></Link>
    </nav>
  </>;
}
