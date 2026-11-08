const CACHE_NAME = 'pierovski-os-v15.1';

const ASSETS = [
  './',
  'index.html',
  'compras.html',
  'plan.html',
  'tarjetas.html',
  'manifest.json',
  'icon.jpg'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Ignorar llamadas en vivo a Firebase para no interferir con la base de datos
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com/identitytoolkit')) {
    return;
  }

  // Estrategia Stale-While-Revalidate para archivos locales y fuentes
  if (url.origin === location.origin || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(e.request);
        const networkFetch = fetch(e.request)
          .then((res) => {
            if (res && res.status === 200) {
              cache.put(e.request, res.clone());
            }
            return res;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
  }
});
