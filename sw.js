self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker Aktif');
});

self.addEventListener('push', (event) => {
    let data = { title: 'Notifikasi SGI', message: 'Ada pembaruan data.', url: '/' };
    if (event.data) {
        try {
            const json = event.data.json();
            // Normalisasi payload NestJS
            data = {
                title: json.title || 'Informasi Gadai',
                message: json.message || json.body || 'Cek aplikasi sekarang',
                url: json.metadata?.directUrl || json.url || '/'
            };
        } catch (e) { data.message = event.data.text(); }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.message,
            icon: '/logo192.png',
            badge: '/logo192.png',
            data: { url: data.url }
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Jika tab aplikasi sudah terbuka, fokus saja
            for (let client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jika belum terbuka, buka tab baru
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});