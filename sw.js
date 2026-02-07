const CACHE_NAME = 'sgi-v2'; 

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            // Hapus cache lama biar SW selalu fresh
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            return caches.delete(cache);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('push', (event) => {
    let data = {};
    
    if (event.data) {
        try {
            // Coba baca sebagai JSON dulu
            data = event.data.json();
        } catch (e) {
            // Kalau gagal (kayak ngetes di DevTools), baca sebagai teks biasa
            data = { message: event.data.text() };
        }
    }

    const payload = data.data || data.notification || data;
    
    // Fallback data agar tidak kosong
    const title = payload.title || 'Sentra Gadai Indonesia';
    const message = payload.message || payload.body || data.message || 'Cek aplikasi sekarang';
    const targetUrl = payload.url || payload.directUrl || '/';
    const noGadai = payload.noGadai || payload.no_gadai || '';

    const options = {
        body: message,
        icon: '/iconSGI.png',
        badge: '/iconSGI.png',
        vibrate: [100, 50, 100],
        tag: noGadai || 'general-notif',
        renotify: true,
        data: { url: targetUrl }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data;
    const urlToOpen = new URL(data.url || '/', self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // 1. Cek kalau ada tab yang lagi kebuka, fokusin aja
                for (let client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // 2. Kalau tab gak ada yang cocok, buka baru atau redirect yang sudah ada
                if (windowClients.length > 0) {
                    return windowClients[0].navigate(urlToOpen).then(client => client.focus());
                }
                // 3. Kalau gak ada window sama sekali, buka baru
                return clients.openWindow(urlToOpen);
            })
    );
});

self.addEventListener('message', (event) => {
    console.log('📨 Message from client:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
