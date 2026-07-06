// Minimal service worker to make the app installable (PWA).
// It does not aggressively cache app data so users always see fresh
// library/loan information; it only enables "Add to Home Screen".

const CACHE = "eblon-biblio-lmf-v1"

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/sign-in"])),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  // Only handle GET navigations; let everything else (API, POST) hit network.
  if (request.method !== "GET") return

  // Network-first for navigations, falling back to cache when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    )
  }
})
