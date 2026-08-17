const CACHE_VERSION = "tourmate-shell-2026-08-2";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/tourmate-192.png",
  "/icons/tourmate-512.png",
  "/icons/tourmate-maskable-512.png",
];

const NEVER_CACHE_PATHS = [
  "/api/",
  "/dashboard",
  "/sign-in",
  "/sign-up",
  "/auth/",
];

function isNeverCachePath(pathname) {
  return NEVER_CACHE_PATHS.some((path) => pathname === path || pathname.startsWith(path));
}

function getOfflineResponse() {
  return caches.open(CACHE_VERSION).then((cache) => cache.match(OFFLINE_URL, { ignoreVary: true }));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("tourmate-shell-") && key !== CACHE_VERSION)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin traffic includes Supabase and remote data providers. It is
  // always network-only and is never written to TourMate caches.
  if (url.origin !== self.location.origin) return;

  // Deterministic browser-test hook. It is unavailable on deployed hosts.
  if (/^(localhost|127\.0\.0\.1)$/.test(url.hostname) && url.pathname === "/pwa-offline-test") {
    event.respondWith(getOfflineResponse());
    return;
  }

  // Auth, account, and API requests (including AI Guide conversations) are
  // always network-only to prevent private responses crossing user sessions.
  if (isNeverCachePath(url.pathname)) {
    if (request.mode === "navigate") {
      event.respondWith(fetch(request).catch(() => getOfflineResponse()));
    }
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => getOfflineResponse()));
    return;
  }

  // Next.js build assets are content-hashed and contain no user data.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (!response.ok) return response;
        const copy = response.clone();
        void caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      })),
    );
  }
});
