// public/sw.js

const CACHE_NAME = "deep-session-cache-v2";
const CORE_ASSETS = [
  "/",                 // app shell
  "/index.html",       // entry point
  "/manifest.json",    // PWA manifest
  "/favicon.ico",      // icon
  "/styles.css",       // global styles
  "/global.css",
  "/script.js",        // main bundle (replace with Next.js output if needed)

  // Firebase SDKs (served from CDN)
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Network-first for API calls
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for core assets
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
