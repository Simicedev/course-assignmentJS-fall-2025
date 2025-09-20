// Minimal service worker for offline-friendly SPA
// Caches same-origin GET requests and provides a basic offline fallback for navigation.

const CACHE_NAME = "my-pwa-shell-v3";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // In development with Vite, avoid intercepting dev server/HMR requests
  // If the request targets @vite client or JS modules under /src, let network handle it
  if (
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/@id/") ||
    url.pathname.startsWith("/src/")
  ) {
    return; // don't call respondWith -> SW won't interfere
  }

  // Only handle same-origin GET requests
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // console.log("Serving from cache:", req.url);
        return cached;
      }
      // Network fallback with graceful offline handling
      return fetch(req).catch(async () => {
        // For navigations, return cached shell if available
        if (req.mode === "navigate") {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match("/")) ||
            (await cache.match("/index.html")) ||
            new Response("Offline", { status: 503, statusText: "Offline" })
          );
        }
        return new Response(null, {
          status: 504,
          statusText: "Gateway Timeout",
        });
      });
    })
  );
});
