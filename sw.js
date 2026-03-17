// ============================================================
//  Footy Brain — sw.js
//  Service Worker: offline caching + install support
// ============================================================

const CACHE_NAME    = 'footybrain-v2';
const OFFLINE_PAGE  = '/offline.html';

// Files to pre-cache on install
const PRECACHE = [
  '/',
  '/index.html',
  '/data.js',
  '/app.js',
  '/games.js',
  '/manifest.json',
  // External CDN resources cached on first fetch (see below)
];

// CDN resources to cache when first fetched
const CDN_CACHE = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700;900&display=swap',
];

// ── INSTALL ─────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Pre-cache failed:', err))
  );
});

// ── ACTIVATE ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Strategy: Cache First for app shell + CDN assets
  // Network First for everything else (keeps content fresh)

  const isAppShell = PRECACHE.some(p => url.pathname === p || url.pathname === p + 'index.html');
  const isCDN      = CDN_CACHE.some(c => request.url.startsWith(c)) ||
                     request.url.includes('fonts.gstatic.com') ||
                     request.url.includes('fonts.googleapis.com');

  if (isAppShell || isCDN) {
    // Cache First — serve from cache, fall back to network, update cache
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // If it's a navigation request and we're offline, show offline page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_PAGE);
          }
        });
      })
    );
  } else {
    // Network First — try network, fall back to cache
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});

// ── BACKGROUND SYNC (future: sync scores to server) ──
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

async function syncScores() {
  // Placeholder — in production, POST scores to your backend here
  console.log('[SW] Background sync: scores');
}

// ── PUSH NOTIFICATIONS (daily challenge reminder) ──
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || '🧠 Footy Brain', {
      body: data.body || "Your daily challenge is ready! Don't break your streak! 🔥",
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'daily-challenge',
      renotify: true,
      data: { url: '/?screen=daily' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});
