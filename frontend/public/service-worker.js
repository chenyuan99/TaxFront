const CACHE_NAME = 'taxfront-shell-v1';

/*
 * On a dev server this worker does more harm than good: it serves the cached
 * app shell over Vite's, so a restarted server hands back a stale bundle — a
 * dead HMR token, env vars that look unset, code that was edited minutes ago.
 * Caching is what makes it useful in production and a liability in dev, so it
 * only caches when it is not running against localhost.
 */
const IS_DEV = ['localhost', '127.0.0.1', '[::1]'].includes(self.location.hostname);
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/icons/taxfront-icon.svg',
];

self.addEventListener('install', (event) => {
    if (IS_DEV) {
        self.skipWaiting();
        return;
    }
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
            ))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Fall through to the network untouched in dev — see IS_DEV above.
    if (IS_DEV || request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
                    return response;
                })
                .catch(() => caches.match('/index.html')),
        );
        return;
    }

    const cacheableDestinations = new Set(['style', 'script', 'image', 'font']);
    if (!cacheableDestinations.has(request.destination)) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request).then((response) => {
            if (response.ok) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
        })),
    );
});
