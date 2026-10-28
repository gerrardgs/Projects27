// Keeps the app itself (HTML, scripts, styles) on the device, so it still opens when the hosting is
// down. API data is not touched here: the app keeps its own per-person copy in IndexedDB and clears it
// at sign-out (src/lib/offline.ts). Pages: network first, falling back to the saved copy; hashed build
// assets under /assets/ never change, so they are served from the cache first.
const CACHE = "keuangan-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add("/"))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put("/", response.clone());
    return response;
  } catch {
    return (await cache.match("/")) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/v1/")) return;
  if (event.request.mode === "navigate") event.respondWith(networkFirst(event.request));
  else if (url.pathname.startsWith("/assets/")) event.respondWith(cacheFirst(event.request));
});
