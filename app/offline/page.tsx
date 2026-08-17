import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline | TourMate AI",
  description: "TourMate AI is currently offline.",
};

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="offline-card" aria-labelledby="offline-title">
        <Image src="/icons/tourmate-192.png" width="88" height="88" alt="" priority />
        <p className="offline-eyebrow">TourMate AI</p>
        <h1 id="offline-title">You&apos;re offline</h1>
        <p>Reconnect to use live AI, current prices, bookings, maps, and authenticated travel data.</p>
        <Link className="button offline-retry" href="/">Try again</Link>
      </section>
      <style>{`
        .offline-page { display: grid; min-height: 100dvh; place-items: center; padding: max(28px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left)); background: radial-gradient(circle at 18% 20%, #d9efff, transparent 32%), radial-gradient(circle at 85% 75%, #d5f7f1, transparent 30%), #f7fbff; font-family: Arial, Helvetica, sans-serif; }
        .offline-card { width: min(100%, 520px); padding: clamp(30px, 7vw, 52px); border: 1px solid #dfeaf4; border-radius: 24px; background: #fff; box-shadow: 0 22px 55px rgb(35 86 133 / 12%); color: #102f56; text-align: center; overflow-wrap: anywhere; }
        .offline-card img { display: block; margin: 0 auto 20px; border-radius: 20px; }
        .offline-eyebrow { margin: 0 0 10px; color: #1667e8; font-size: 13px; font-weight: 800; letter-spacing: .7px; text-transform: uppercase; }
        .offline-card h1 { margin: 0; font-size: clamp(32px, 8vw, 48px); line-height: 1.08; }
        .offline-card > p:not(.offline-eyebrow) { margin: 18px auto 26px; color: #496079; font-size: 16px; line-height: 1.65; }
        .offline-retry { min-height: 48px; padding: 13px 24px; }
      `}</style>
    </main>
  );
}
