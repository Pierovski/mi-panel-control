const CACHE_NAME = 'pierovski-v5.6'; // Sube este número cada vez que modifiques tu código

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
  'plan_topografia.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Fuerza a que el nuevo Service Worker se instale de inmediato
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Elimina la basura de versiones pasadas
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ESTRATEGIA: NETWORK FIRST (Red primero, luego caché)
self.addEventListener('fetch', (e) => {
  // Solo aplicamos Network First a los archivos HTML para que siempre veas la última versión de tu código
  if (e.request.mode === 'navigate' || e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, response.clone());
          return response;
        });
      }).catch(() => {
        // Si no hay internet, saca la versión guardada del caché
        return caches.match(e.request);
      })
    );
  } else {
    // Para imágenes y otros archivos, usamos Stale-While-Revalidate
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        const fetchPromise = fetch(e.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {});
        return cachedResponse || fetchPromise;
      })
    );
  }
});
