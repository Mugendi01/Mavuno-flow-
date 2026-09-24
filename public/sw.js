// FarmPulse Progressive Web App Service Worker
const CACHE_NAME = "farmpulse-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/transactions",
  "/transactions/new",
  "/sales",
  "/expenses",
  "/receivables",
  "/enterprises",
  "/reports",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
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
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stale-while-revalidate for static assets, Network-first for API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Don't cache non-GET or chrome-extension or API mutations
  if (event.request.method !== "GET" || url.protocol === "chrome-extension:") {
    return;
  }

  // Network-first for dynamic API routes
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

  // Stale-while-revalidate for pages and assets
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
