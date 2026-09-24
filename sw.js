const CACHE_NAME = 'aarvi-agent-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './images/icon.png'
];

// 1. Install Event - Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// 2. Activate Event - Clean up old caches on update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Ensure the Service Worker takes control of the page immediately
  self.clients.claim();
});

// 3. Fetch Event - Network First, Fallback to Cache
self.addEventListener('fetch', (event) => {
  // We only want to cache our local app files, not the live Firebase data stream
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If the network request succeeds, clone and save the fresh copy to cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If the network fails (driver goes through a tunnel/loses signal), serve the cached shell
        return caches.match(event.request);
      })
  );
});
