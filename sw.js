// Footy Brain Service Worker v4
'use strict';

const CACHE = 'footybrain-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/data.js',
  '/data-batch2.js',
  '/data-batch3.js',
  '/data-positions.js',
  '/data-positions-2.js',
  '/data-career.js',
  '/data-sunday.js',
  '/app-v3.js',
  '/app-main.js',
  '/path.js',
  '/games.js',
  '/penalty3d.js',
  '/packs.js',
  '/drills.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// External CDN assets (cache on first use)
const CDN_PATTERNS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  
  // CDN: cache-first
  if (CDN_PATTERNS.some(p => url.includes(p))) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
      )
    );
    return;
  }

  // App assets: cache-first, fallback to network then offline
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok && resp.type !== 'opaque') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});
