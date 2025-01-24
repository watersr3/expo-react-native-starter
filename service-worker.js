const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

// Install the service worker and cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

// Activate the service worker and remove outdated caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch resources
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return (
                response ||
                fetch(event.request).then(fetchResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        // Cache the new response for future use
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                })
            );
        }).catch(() => {
            // Handle offline scenario for certain routes
            if (event.request.url.endsWith('.html')) {
                return caches.match('/index.html');
            }
        })
    );
});

// Listen for network reconnection and update the app
self.addEventListener('sync', event => {
    if (event.tag === 'update-cache') {
        event.waitUntil(
            caches.open(CACHE_NAME).then(cache => {
                return Promise.all(
                    urlsToCache.map(url => {
                        return fetch(url).then(response => {
                            if (response.ok) {
                                return cache.put(url, response);
                            }
                        });
                    })
                );
            })
        );
    }
});
