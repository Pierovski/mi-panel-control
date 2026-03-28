const CACHE_NAME = 'pierovski-v1.0.0';

// Lista exacta de archivos que tu celular guardará para usar sin internet
const ASSETS = [
  './',
  'index.html',
  'compras.html',
  'plan.html',
  'tarjetas.html',
  'manifest.json',
  'icon.png'
];

// 1. INSTALACIÓN: Descarga y guarda los archivos en el celular
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Guardando archivos en caché');
      return cache.addAll(ASSETS);
    })
  );
  // Fuerza al Service Worker a instalarse inmediatamente
  self.skipWaiting(); 
});

// 2. ACTIVACIÓN: Limpia la basura. Si cambias el CACHE_NAME, borra la versión vieja.
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
  // Toma el control de la aplicación de inmediato sin tener que recargar la página
  self.clients.claim();
});

// 3. ESTRATEGIA DE RED: "Stale-While-Revalidate" (Caché primero, red en segundo plano)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Dispara la petición a la red (si hay internet) para tener lo más nuevo
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        // Guarda la versión nueva en el caché para la próxima vez
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // Si no hay internet, no hace nada, porque devolverá el caché abajo
      });
      
      // Devuelve la respuesta del caché INMEDIATAMENTE (para velocidad) 
      // o espera la red si no estaba en caché.
      return cachedResponse || fetchPromise;
    })
  );
});