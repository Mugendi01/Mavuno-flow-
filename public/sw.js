// MavunoFlow Progressive Web App Service Worker
const CACHE_NAME = "farmpulse-cache-v2";

// Core static app shell & branding assets
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/icons/farmpulse-logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Purging outdated cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stale-while-revalidate for static assets, Network-First for navigation and dynamic APIs
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Skip non-GET requests and browser extensions
  if (event.request.method !== "GET" || url.protocol === "chrome-extension:") {
    return;
  }

  // 2. Bypass webpack HMR, dev hot-reloads, Next.js server actions, or URLs with query timestamps
  if (
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.includes("__nextjs") ||
    url.searchParams.has("v") ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1"
  ) {
    return;
  }

  // 3. Network-only with offline JSON fallback for API routes
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: "Offline mode active" }), {
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // 4. Network-First strategy for HTML navigation requests
  // Guarantees fresh HTML matching current server chunks, preventing chunk 404s
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Fallback to cache when completely offline
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match("/dashboard") || caches.match("/");
        })
    );
    return;
  }

  // 5. Stale-While-Revalidate for immutable static assets (icons, manifest, production _next/static/)
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
