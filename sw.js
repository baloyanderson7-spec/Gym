const CACHE_NAME = 'bitacora-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;700&display=swap',
  'https://fonts.gstatic.com/'
];

// Install event: cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: network first, then cache
self.addEventListener('fetch', event => {
  // Skip cross-origin requests and APIs
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('api.anthropic.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        // Clone the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseToCache));
        return response;
      })
      .catch(() => {
        // Return cached version if network fails
        return caches.match(event.request)
          .then(cachedResponse => {
            return cachedResponse || new Response('Offline - cached version not available');
          });
      })
  );
});
