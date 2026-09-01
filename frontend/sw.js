// =====================================================================
//  KingBot V8.7 Platform — Service Worker
//  Caches static assets for offline use and PWA installability.
// =====================================================================
const CACHE = "kingbot-v87-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/pricing.html",
  "/strategies.html",
  "/signup.html",
  "/login.html",
  "/dashboard.html",
  "/analytics.html",
  "/profile.html",
  "/guides.html",
  "/verify-email.html",
  "/css/theme.css",
  "/js/config.js",
  "/js/app.js",
  "/assets/favicon.svg",
  "/manifest/manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // Only handle GET requests for same-origin
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // don't cache API calls

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
