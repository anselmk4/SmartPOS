const CACHE_NAME = "kuettu-pos-v2.0";

// Essential core shell routes
const PRECACHE_ROUTES = [
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
  "/",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg",
  "/favicon.ico",
];

// Install: Cache all essential pages and assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        console.log("[SW] Pre-caching core routes and assets");
        for (const route of PRECACHE_ROUTES) {
          try {
            await cache.add(route);
            // Also attempt to precache RSC payload
            try {
              const rscRequest = new Request(route, { headers: { RSC: "1" } });
              const rscRes = await fetch(rscRequest);
              if (rscRes.ok) {
                await cache.put(rscRequest, rscRes);
              }
            } catch {
              // RSC payload optional at install
            }
          } catch (e) {
            console.warn("[SW] Route precache skipped for:", route, e);
          }
        }
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log("[SW] Removing old cache:", key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper: Normalize request to match without dynamic _rsc query
function getCleanUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    u.searchParams.delete("_rsc");
    return u.pathname;
  } catch {
    return urlStr;
  }
}

// Fetch: Bulletproof Offline Strategy for Next.js App Router
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser extension protocols
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Skip localhost / development hot reload to prevent dev CSS cache corruption
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.pathname.includes("webpack-hmr")) {
    return;
  }

  // 1. Next.js Static Chunks, CSS, JS, Fonts, Images (Cache-First with background revalidation)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const resClone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
            }
            return res;
          })
          .catch(() => {
            // Return 200 empty response for optional chunks if missing while offline
            return new Response("", { status: 200, headers: { "Content-Type": "text/javascript" } });
          });
      })
    );
    return;
  }

  // 2. Next.js RSC Prefetch Requests (_rsc query param or RSC header)
  const isRSC = url.searchParams.has("_rsc") || request.headers.get("RSC") === "1";
  if (isRSC) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
          }
          return res;
        })
        .catch(async () => {
          // Check direct match
          const cached = await caches.match(request);
          if (cached) return cached;

          // Check without query param
          const cleanPath = getCleanUrl(request.url);
          const cachedClean = await caches.match(cleanPath);
          if (cachedClean) return cachedClean;

          // Fallback to cached /pos
          const posCached = await caches.match("/pos");
          if (posCached) return posCached;

          return new Response("", { status: 200, headers: { "Content-Type": "text/x-component" } });
        })
    );
    return;
  }

  // 3. Navigation Requests (User opening or refreshing a URL)
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
          // Try direct match
          const cached = await caches.match(request);
          if (cached) return cached;

          // Try pathname without query string
          const pathOnly = url.pathname;
          const cachedPath = await caches.match(pathOnly);
          if (cachedPath) return cachedPath;

          // Fallbacks in order of importance
          const posFallback = await caches.match("/pos");
          if (posFallback) return posFallback;

          const loginFallback = await caches.match("/auth/login");
          if (loginFallback) return loginFallback;

          const rootFallback = await caches.match("/");
          if (rootFallback) return rootFallback;

          return new Response("Hors-ligne", { status: 200, headers: { "Content-Type": "text/html" } });
        })
    );
    return;
  }

  // 4. All Other Requests (Network first, fallback to cache)
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ offline: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      })
  );
});
