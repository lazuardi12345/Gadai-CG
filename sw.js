self.addEventListener('install', (event) => {
    console.log('✅ SW Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('🚀 SW Activated');
});

self.addEventListener('push', (event) => {
    let payload = {};
    
    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            payload = { message: event.data.text() };
        }
    }

    console.log('📩 Push Received:', payload);

    const title = payload.title || 'Notifikasi Baru';
    const options = {
        body: payload.message || 'Klik untuk melihat detail',
        icon: '/icon-192x192.png',
        badge: '/badge.png',
        vibrate: [100, 50, 100],
        data: {
            url: payload.url || '/' 
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const targetUrl = notification.data?.url || '/'; 

    notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                // Gunakan URL objek untuk perbandingan yang lebih akurat
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});