/*
 * Firebase Cloud Messaging service worker — displays job notifications that
 * arrive while no TaxFront tab is open.
 *
 * Registered by `src/services/pushService.ts` at the scope
 * `/firebase-cloud-messaging-push-scope`, deliberately narrower than the
 * app-shell worker at `/` so the two do not evict each other.
 *
 * A worker cannot read Vite's `import.meta.env`, so the Firebase config arrives
 * as query parameters on this script's own URL.
 */
importScripts(
    'https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js',
);

const config = new URL(self.location.href).searchParams;

firebase.initializeApp({
    apiKey: config.get('apiKey'),
    projectId: config.get('projectId'),
    messagingSenderId: config.get('messagingSenderId'),
    appId: config.get('appId'),
});

const messaging = firebase.messaging();

/*
 * The backend sends data-only messages, so nothing is displayed unless we do it
 * here. That is the point: it keeps the browser from rendering its own copy
 * alongside this one, and leaves the click behaviour below in our hands.
 */
messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const link = data.link || '/jobs';

    self.registration.showNotification(data.title || 'TaxFront', {
        body: data.body || '',
        icon: '/icons/taxfront-icon.svg',
        // Collapses repeat pushes about the same job into a single notification.
        tag: data.tag || 'taxfront-job',
        data: { link },
    });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const link = event.notification.data?.link || '/jobs';

    // Prefer an open TaxFront tab over spawning another one.
    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (new URL(client.url).origin === self.location.origin) {
                        return client.focus().then((focused) =>
                            focused.navigate ? focused.navigate(link) : focused,
                        );
                    }
                }
                return self.clients.openWindow(link);
            }),
    );
});
