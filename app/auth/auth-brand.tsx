import Link from "next/link";

export function AuthBrand() {
  return (
    <Link className="brand" href="/" aria-label="TourMate AI home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="10.5" />
          <path d="M3.5 14h21M14 3.5c3 3.2 4.5 6.7 4.5 10.5S17 21.3 14 24.5c-3-3.2-4.5-6.7-4.5-10.5S11 6.7 14 3.5Z" />
          <path d="m17.8 7.7-2.3 5.8-5.8 2.3 2.3-5.8 5.8-2.3Z" />
        </svg>
      </span>
      <span>
        TourMate <strong>AI</strong>
      </span>
    </Link>
  );
}
