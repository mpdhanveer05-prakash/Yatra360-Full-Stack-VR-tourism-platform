// Yatra360 service worker.
// Strategies:
//   - App shell (HTML/JS/CSS): network-first, fall back to cache.
//   - Wikimedia / panorama images: cache-first, then network, with size cap.
//   - Wikipedia API: stale-while-revalidate (1 day).
//   - Yatra360 backend API: network-first, short timeout, then fall through.

const VERSION = 'yatra360-v5'
const SHELL_CACHE     = `${VERSION}-shell`
const PANORAMA_CACHE  = `${VERSION}-panoramas`
const WIKI_CACHE      = `${VERSION}-wiki`
const RUNTIME_CACHE   = `${VERSION}-runtime`

const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
]

const MAX_PANORAMA_ENTRIES = 80
const MAX_WIKI_ENTRIES     = 60

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(c => c.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('yatra360-') && !k.startsWith(VERSION))
          .map(k => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Cross-origin image (Wikimedia, Picsum, Unsplash, etc.)
  if (req.destination === 'image' && url.origin !== self.location.origin) {
    event.respondWith(cacheFirst(req, PANORAMA_CACHE, MAX_PANORAMA_ENTRIES))
    return
  }

  // Wikipedia API
  if (url.hostname.endsWith('wikipedia.org')) {
    event.respondWith(staleWhileRevalidate(req, WIKI_CACHE, MAX_WIKI_ENTRIES))
    return
  }

  // Same-origin: network-first for HTML / API; cache-first for static assets.
  if (url.origin === self.location.origin) {
    if (req.destination === 'document' || url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirst(req, SHELL_CACHE))
    } else {
      event.respondWith(cacheFirst(req, RUNTIME_CACHE, 200))
    }
  }
})

async function cacheFirst(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  if (cached) return cached
  try {
    const res = await fetch(req)
    if (res.ok) {
      cache.put(req, res.clone())
      trimCache(cacheName, maxEntries)
    }
    return res
  } catch (err) {
    return cached ?? Response.error()
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch (err) {
    const cached = await cache.match(req)
    if (cached) return cached
    if (req.destination === 'document') {
      // Last-ditch: return the cached app shell
      const shell = await caches.match('/')
      if (shell) return shell
    }
    return Response.error()
  }
}

async function staleWhileRevalidate(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  const fetchPromise = fetch(req).then(res => {
    if (res.ok) {
      cache.put(req, res.clone())
      trimCache(cacheName, maxEntries)
    }
    return res
  }).catch(() => cached)
  return cached || fetchPromise
}

async function trimCache(cacheName, maxEntries) {
  if (!maxEntries) return
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= maxEntries) return
  // FIFO eviction
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i])
  }
}
