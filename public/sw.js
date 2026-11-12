const CACHE_NAME = "musicku-cache-v1";
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.png",
  "/icon.jpg",
  "/logo.png",
  "/apple-icon.jpg",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass Service Worker completely for audio streams and auth requests
  if (
    url.pathname.startsWith("/api/stream") ||
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/") ||
    event.request.headers.get("range")
  ) {
    return;
  }

  // 2. Cache-First for static image assets
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
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return res;
          })
        );
      })
    );
    return;
  }

  // 3. Network-First for navigation & pages
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/");
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

