/**
 * sw.js — Service Worker pro FoodTech PWA 'ВкусноПаскуда!'.
 * 
 * Zajišťuje:
 *  1. Offline dostupnost celé SPA aplikace (App Shell cache).
 *  2. Cachování receptů, surovin a nákupního košíku pro použití v podzemních supermarketech bez signálu.
 *  3. Network-First strategii s Cache-Fallbackem pro dynamické API dotazy.
 *  4. Stale-While-Revalidate pro statické assety (CSS, JS, SVG).
 */

const STATIC_CACHE_NAME = 'vkusno-static-v2';
const API_CACHE_NAME = 'vkusno-api-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

// 1. Install Event — Přednačtení základního App Shellu
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event — Čištění starých verzí mezipaměti
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event — Směrování a strategie obsluhy požadavků
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorovat non-GET požadavky (POST/PUT/DELETE se posílají rovnou)
  if (request.method !== 'GET') {
    return;
  }

  // A. API požadavky: /api/v1/recipes, /api/v1/shopping, /api/v1/users
  if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Uložit úspěšnou odpověď do API mezipaměti
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Fallback: Pokud je uživatel offline (např. v supermarketu)
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Pokud záznam v cache není, vrátíme strukturovaný offline fallback s kódem 503
          return new Response(
            JSON.stringify({
              offline: true,
              message: 'Jste offline. Data nejsou v mezipaměti.',
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
              statusText: 'Service Unavailable (Offline)',
            }
          );
        })
    );
    return;
  }

  // B. Navigační požadavky (SPA HTML stránky)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedIndex = await caches.match('/index.html');
        return cachedIndex || caches.match('/') || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // C. Statické assety (JS, CSS, obrázky, ikony) — Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || new Response('', { status: 503, statusText: 'Offline Asset Unavailable' }));

      return cachedResponse || fetchPromise;
    })
  );
});
