 /* ============================================
   SERVICE-WORKER.JS - سرویس ورکر برای PWA
   ============================================ */

const CACHE_NAME = 'booking-platform-v1.0.0';
const OFFLINE_URL = '/offline.html';

// فایل‌هایی که باید کش شوند
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/css/core/reset.css',
    '/css/core/variables.css',
    '/css/core/typography.css',
    '/css/core/utilities.css',
    '/css/themes/light-theme.css',
    '/css/themes/dark-theme.css',
    '/css/layouts/header.css',
    '/css/layouts/footer.css',
    '/css/components/buttons.css',
    '/css/components/cards.css',
    '/css/components/forms.css',
    '/css/components/modals.css',
    '/css/responsive/mobile.css',
    '/css/responsive/tablet.css',
    '/css/responsive/desktop.css',
    '/js/core/app.js',
    '/js/core/router.js',
    '/js/core/state-manager.js',
    '/js/core/event-bus.js',
    '/js/core/config-loader.js',
    '/js/modules/auth/session.js',
    '/js/modules/auth/login.js',
    '/js/modules/auth/register.js',
    '/js/utils/helpers/price-helper.js',
    '/js/utils/helpers/date-helper.js',
    '/js/ui/widgets/notification-bell.js'
];

// نصب سرویس ورکر
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// فعال‌سازی سرویس ورکر
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Claiming clients');
            return self.clients.claim();
        })
    );
});

// استراتژی کش: Network First با Fallback به Cache
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // درخواست‌های API را کش نکن
    if (url.pathname.startsWith('/api/')) {
        return;
    }
    
    // درخواست‌های HTML: Network First
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // کش کردن نسخه جدید
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            return caches.match(OFFLINE_URL);
                        });
                })
        );
        return;
    }
    
    // درخواست‌های استاتیک: Cache First
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request)
                    .then((response) => {
                        // کش کردن فایل‌های استاتیک
                        if (request.method === 'GET' && 
                            (request.destination === 'style' || 
                             request.destination === 'script' || 
                             request.destination === 'image')) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    });
            })
    );
});

// همگام‌سازی پس‌زمینه (Background Sync)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-bookings') {
        event.waitUntil(syncBookings());
    }
});

// ارسال نوتیفیکیشن پوش
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);
    
    let data = {
        title: 'پیام جدید',
        body: 'یک پیام جدید دریافت شده است',
        icon: '/assets/images/logo/logo-light.svg',
        badge: '/assets/images/logo/favicon.ico',
        data: {
            url: '/'
        }
    };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.badge,
            data: data.data,
            vibrate: [200, 100, 200],
            actions: [
                { action: 'open', title: 'مشاهده' },
                { action: 'close', title: 'بستن' }
            ]
        })
    );
});

// کلیک روی نوتیفیکیشن
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click:', event);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
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

// همگام‌سازی نوبت‌ها
async function syncBookings() {
    console.log('[Service Worker] Syncing bookings...');
    
    const cache = await caches.open(CACHE_NAME);
    const syncRequests = await cache.match('/sync-queue');
    
    if (syncRequests) {
        const queue = await syncRequests.json();
        
        for (const request of queue) {
            try {
                const response = await fetch(request.url, {
                    method: request.method,
                    headers: request.headers,
                    body: request.body
                });
                
                if (response.ok) {
                    // حذف از صف پس از موفقیت
                    const updatedQueue = queue.filter(r => r.id !== request.id);
                    await cache.put('/sync-queue', new Response(JSON.stringify(updatedQueue)));
                }
            } catch (error) {
                console.error('Sync failed:', error);
            }
        }
    }
}

// مدیریت خطاهای آفلاین
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        // ذخیره درخواست‌های POST برای همگام‌سازی بعدی
        event.respondWith(
            fetch(event.request).catch(async (error) => {
                const cache = await caches.open(CACHE_NAME);
                const syncQueue = await cache.match('/sync-queue');
                let queue = [];
                
                if (syncQueue) {
                    queue = await syncQueue.json();
                }
                
                queue.push({
                    id: Date.now(),
                    url: event.request.url,
                    method: event.request.method,
                    headers: Object.fromEntries(event.request.headers),
                    body: await event.request.clone().text()
                });
                
                await cache.put('/sync-queue', new Response(JSON.stringify(queue)));
                
                // درخواست همگام‌سازی پس‌زمینه
                await self.registration.sync.register('sync-bookings');
                
                return new Response(JSON.stringify({
                    success: true,
                    queued: true,
                    message: 'درخواست در صف قرار گرفت'
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
    }
});
