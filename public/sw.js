const CACHE_NAME = "kuettu-pos-v1.1";

// Essential core shell routes to cache for 100% offline availability
const PRECACHE_URLS = [
  "/pos",
  "/debts",
  "/expenses",
  "/inventory",
  "/dashboard",
  "/owner",
  "/billing",
  "/settings",
  "/auth/login",
  "/auth/register",
  "/manifest.json",
  "/favicon.ico",
];

// Install Event: Pre-cache core shell pages and assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Pre-caching offline app shell");
        return cache.addAll(PRECACHE_URLS).catch((err) => {
          console.warn("[SW] Some assets failed to precache:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clear old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Offline interceptor & Caching Strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // 1. Navigation Requests (Page reloads, changing URLs in browser bar)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // If offline, check matching cached page
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to POS or Root HTML shell
          const posFallback = await caches.match("/pos");
          if (posFallback) return posFallback;

          const loginFallback = await caches.match("/auth/login");
          if (loginFallback) return loginFallback;

          return caches.match("/");
        })
    );
    return;
  }

  // 2. Next.js Static Chunks, JS, CSS, Web Fonts, Images (Stale-While-Revalidate / Cache-First)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failure ignored, served from cache
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. All other requests: Network with Cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
