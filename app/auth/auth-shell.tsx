import Link from "next/link";
import type { ReactNode } from "react";
import { AuthBrand } from "./auth-brand";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthShell({ children, eyebrow, title, description }: AuthShellProps) {
  return (
    <div className="site-shell auth-page">
      <header className="auth-header">
        <nav className="nav container" aria-label="Authentication navigation">
          <AuthBrand />
          <Link className="auth-back-link" href="/">
            <span aria-hidden="true">←</span> Back to home
          </Link>
        </nav>
      </header>
      <main className="auth-main">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-heading">
            <div className="eyebrow"><span aria-hidden="true">✦</span> {eyebrow}</div>
            <h1 id="auth-title">{title}</h1>
            <p>{description}</p>
          </div>
          {children}
        </section>
      </main>
    </div>
  );
}
