const CACHE_VERSION = 'v1';
const CACHE_NAME = `notes-app-${CACHE_VERSION}`;

const LOCAL_RESOURCES = [
  './',
  './index.html',
  './historial.html',
  './ajustes.html',
  './app.js',
  './service-worker.js',
  './pwa/logo-app.png',
  './pwa/manifest.json'
];

const REMOTE_RESOURCES = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3WmMLNSvZM.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(LOCAL_RESOURCES);
      await Promise.allSettled(
        REMOTE_RESOURCES.map(async url => {
          try {
            await cache.add(new Request(url, { mode: 'no-cors' }));
          } catch (error) {
            console.warn('[ServiceWorker] Unable to cache remote resource:', url, error);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames
        .filter(cacheName => cacheName.startsWith('notes-app-') && cacheName !== CACHE_NAME)
        .map(cacheName => caches.delete(cacheName))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const shouldCache = response && (response.ok || response.type === 'opaque');
        if (shouldCache) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        throw new Error('Network request failed and no cache available.');
      })
  );
});
