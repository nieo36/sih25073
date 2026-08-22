const CACHE_VERSION = 'kreedai-pwa-v2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Core App Shell assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg',
  '/pwa-maskable-512x512.svg',
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache asset fetch failure:', err);
      });
    })
  );
  // Don't force skipWaiting immediately so users aren't disrupted mid-workout
});

// Activate: clean up outdated cache buckets
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            console.log('[SW] Deleting obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for client message to trigger update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Strategy dispatcher
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. NEVER cache API requests or non-GET requests (protects user privacy / auth tokens)
  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.includes('/api/v1/')) {
    return; // Pass through to network natively
  }

  // 2. HTML SPA Navigation requests -> Network-first with offline /index.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 3. Static assets, fonts, styles, scripts -> Stale-While-Revalidate
  const isStaticAsset =
    url.origin === self.location.origin ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2|woff|ttf)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone()).catch(() => {});
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});
