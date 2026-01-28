self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker Aktif (pawn-apps)');
});

self.addEventListener('push', (event) => {
    let payload = {
        title: 'Notifikasi SGI',
        body: 'Ada aktivitas baru di sistem.',
        icon: '/logo192.png', 
        data: { url: '/' }
    };

    if (event.data) {
        try {
            const data = event.data.json();
            payload = {
                title: data.title || 'Informasi Gadai',
                body: data.message || data.body || 'Klik untuk cek detail',
                icon: '/logo192.png',
                badge: '/badge.png', 
                data: {
                    url: data.url || '/'
                }
            };
        } catch (e) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        vibrate: [200, 100, 200],
        data: payload.data,
        actions: [
            { action: 'open', title: 'Buka Aplikasi' }
        ]
    };

    event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});