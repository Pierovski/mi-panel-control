const CACHE_NAME = 'pierovski-v3.4'; // Incremementamos versión

// Lista exacta de archivos que tu celular guardará para usar sin internet
const ASSETS = [
  './',
  'index.html',
  'compras.html',
  'plan.html',
  'tarjetas.html',
  'manifest.json',
  'icon.png',
  'plan_finanzas.json',
  'plan_gimnasio.json',
  'plan_topografia.json' // Agregados para soporte offline total
];

// 1. INSTALACIÓN: Descarga y guarda los archivos en el celular
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Guardando archivos en caché');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); 
});

// 2. ACTIVACIÓN: Limpia la basura de versiones antiguas
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. ESTRATEGIA DE RED: "Stale-While-Revalidate"
self.addEventListener('fetch', (e) => {
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
});
