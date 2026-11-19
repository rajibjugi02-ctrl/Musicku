const STATIC_CACHE = "musicku-static-v2";
const COVER_CACHE = "musicku-cover-cache-v1";
const MAX_COVER_ITEMS = 200;

const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.png",
  "/icon.jpg",
  "/logo.png",
  "/apple-icon.jpg",
  "/favicon.ico",
];

// High-speed album cover and artwork CDNs
const COVER_DOMAINS = [
  "mzstatic.com",
  "dzcdn.net",
  "scdn.co",
  "ytimg.com",
  "saavncdn.com",
];

/**
 * LRU cache pruning to keep album cover memory lightweight (< 200 items)
 */
async function pruneCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const itemsToDelete = keys.slice(0, keys.length - maxItems);
      for (const req of itemsToDelete) {
        await cache.delete(req);
      }
    }
  } catch {
    // Ignore pruning errors
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE && key !== COVER_CACHE) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Never intercept streaming audio, live API endpoints, auth, or partial range requests
  if (
    url.pathname.startsWith("/api/stream") ||
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/") ||
    event.request.headers.get("range")
  ) {
    return;
  }

  // 2. Cache-First with 0ms delivery for Album Covers (Apple, Deezer, Spotify, YouTube, JioSaavn)
  const isCoverRequest =
    COVER_DOMAINS.some((domain) => url.hostname.includes(domain)) ||
    (event.request.destination === "image" && url.origin !== self.location.origin);

  if (isCoverRequest) {
    event.respondWith(
      caches.open(COVER_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          return cached;
        }

        try {
          const networkRes = await fetch(event.request);
          if (networkRes && (networkRes.status === 200 || networkRes.type === "opaque")) {
            // Save image clone and prune cache asynchronously
            cache.put(event.request, networkRes.clone()).then(() => {
              pruneCache(COVER_CACHE, MAX_COVER_ITEMS);
            });
          }
          return networkRes;
        } catch {
          return cached || new Response("", { status: 408 });
        }
      })
    );
    return;
  }

  // 3. Cache-First for static UI assets
  if (
    url.pathname.startsWith("/logo") ||
    url.pathname.startsWith("/icon") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((res) => {
            if (res.status === 200) {
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
            }
            return res;
          })
        );
      })
    );
    return;
  }

  // 4. Network-First for Navigation
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/"))
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
