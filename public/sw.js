const CACHE_VERSION = 'cheq-v1'
const OFFLINE_URL = '/offline'

// ---------------------------------------------------------------------------
// Install — precache the offline fallback page
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.add(OFFLINE_URL))
  )
  self.skipWaiting()
})

// ---------------------------------------------------------------------------
// Activate — purge old caches
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ---------------------------------------------------------------------------
// Fetch — auth-aware caching
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // SECURITY: Never intercept auth routes or non-GET requests (Server Actions)
  if (url.pathname.startsWith('/auth') || event.request.method !== 'GET') {
    return
  }

  // Cache-first for immutable Next.js static assets (content-hashed filenames)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached ||
        fetch(event.request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone))
          return response
        })
      )
    )
    return
  }

  // Cache-first for font files
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached ||
        fetch(event.request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone))
          return response
        })
      )
    )
    return
  }

  // Network-first for navigation requests — offline fallback if network fails
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    )
    return
  }
})
