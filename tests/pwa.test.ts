import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";
import OfflinePage from "@/app/offline/page";
import { getInstallAvailability, isIosSafari } from "@/utils/pwa/install";

describe("TourMate PWA manifest", () => {
  it("contains the required install metadata and icons", () => {
    const value = manifest();
    expect(value).toMatchObject({
      name: "TourMate AI",
      short_name: "TourMate",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#f7fbff",
      theme_color: "#102f56",
    });
    expect(value.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/icons/tourmate-192.png", sizes: "192x192" }),
      expect.objectContaining({ src: "/icons/tourmate-512.png", sizes: "512x512" }),
      expect.objectContaining({ src: "/icons/tourmate-maskable-512.png", purpose: "maskable" }),
    ]));
  });
});

describe("service-worker cache safety", () => {
  const source = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

  it.each(["/api/", "/dashboard", "/sign-in", "/sign-up", "/auth/"])(
    "keeps %s on the network",
    (path) => expect(source).toContain(`"${path}"`),
  );

  it("rejects cross-origin caching and limits runtime writes to hashed static assets", () => {
    expect(source).toContain("url.origin !== self.location.origin");
    expect(source).toContain('url.pathname.startsWith("/_next/static/")');
    expect(source.match(/cache\.put\(/g)).toHaveLength(1);
    expect(source).not.toContain('caches.match("/dashboard")');
    expect(source).not.toContain('caches.match("/api/');
  });

  it("removes only outdated TourMate-owned caches", () => {
    expect(source).toContain('key.startsWith("tourmate-shell-") && key !== CACHE_VERSION');
  });
});

describe("install prompt visibility", () => {
  it("shows a captured browser prompt only when eligible", () => {
    expect(getInstallAvailability({ isStandalone: false, isDismissed: false, hasPrompt: true, isIosSafari: false })).toBe("prompt");
  });

  it("shows iOS guidance when Safari cannot emit the browser prompt", () => {
    expect(isIosSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1")).toBe(true);
    expect(getInstallAvailability({ isStandalone: false, isDismissed: false, hasPrompt: false, isIosSafari: true })).toBe("ios");
  });

  it("stays hidden when installed, dismissed, or in an unsupported browser", () => {
    expect(getInstallAvailability({ isStandalone: true, isDismissed: false, hasPrompt: true, isIosSafari: false })).toBe("hidden");
    expect(getInstallAvailability({ isStandalone: false, isDismissed: true, hasPrompt: true, isIosSafari: false })).toBe("hidden");
    expect(getInstallAvailability({ isStandalone: false, isDismissed: false, hasPrompt: false, isIosSafari: false })).toBe("hidden");
  });
});

describe("offline page", () => {
  it("renders a deliberate limitation message and retry action", () => {
    const html = renderToStaticMarkup(OfflinePage());
    expect(html).toContain("You&#x27;re offline");
    expect(html).toContain("live AI, current prices, bookings, maps, and authenticated travel data");
    expect(html).toContain('href="/"');
  });
});
