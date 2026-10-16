const CACHE_NAME = 'pierovski-v10';

const ASSETS = [
  './',
  'index.html',
  'compras.html',
  'plan.html',
  'tarjetas.html',
  'manifest.json',
  'icon.jpg',
  'plan_finanzas.json',
  'plan_gimnasio.json',
  'plan_topografia.json',
  'plan_pueblo.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Ignorar peticiones a Firebase o APIs externas para no romper la sincronización en tiempo real
  if (url.origin !== location.origin) return;

  const acceptHeader = e.request.headers.get('accept') || '';

  // Network First para HTML y JSON de planes
  if (e.request.mode === 'navigate' || acceptHeader.includes('text/html') || url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request).then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return response;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Stale-While-Revalidate para íconos y recursos locales
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        const fetchPromise = fetch(e.request).then((networkResponse) => {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
          return networkResponse;
        }).catch(() => {});
        return cachedResponse || fetchPromise;
      })
    );
  }
});
