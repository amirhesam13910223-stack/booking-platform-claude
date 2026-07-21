 /* ============================================
   CACHE-STRATEGIES.JS - استراتژی‌های کشینگ
   ============================================ */

const CacheStrategies = {
    // استراتژی: Cache First (ابتدا کش، سپس شبکه)
    cacheFirst: async (request, cacheName) => {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        try {
            const networkResponse = await fetch(request);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        } catch (error) {
            return new Response('Network error', { status: 408 });
        }
    },
    
    // استراتژی: Network First (ابتدا شبکه، سپس کش)
    networkFirst: async (request, cacheName, timeout = 3000) => {
        const cache = await caches.open(cacheName);
        
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), timeout);
            });
            
            const fetchPromise = fetch(request);
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            cache.put(request, response.clone());
            return response;
        } catch (error) {
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
            return new Response('Offline', { status: 503 });
        }
    },
    
    // استراتژی: Stale While Revalidate
    staleWhileRevalidate: async (request, cacheName) => {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        const fetchPromise = fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        });
        
        return cachedResponse || fetchPromise;
    },
    
    // استراتژی: Cache Only
    cacheOnly: async (request, cacheName) => {
        const cache = await caches.open(cacheName);
        return await cache.match(request);
    },
    
    // استراتژی: Network Only
    networkOnly: async (request) => {
        return await fetch(request);
    },
    
    // پیش‌کش کردن فایل‌ها
    precache: async (urls, cacheName) => {
        const cache = await caches.open(cacheName);
        await cache.addAll(urls);
    },
    
    // به‌روزرسانی کش
    updateCache: async (request, cacheName) => {
        const cache = await caches.open(cacheName);
        try {
            const response = await fetch(request);
            await cache.put(request, response.clone());
            return response;
        } catch (error) {
            return await cache.match(request);
        }
    },
    
    // پاک کردن کش قدیمی
    cleanOldCaches: async (currentCacheName) => {
        const cacheNames = await caches.keys();
        return Promise.all(
            cacheNames.map(cacheName => {
                if (cacheName !== currentCacheName) {
                    return caches.delete(cacheName);
                }
            })
        );
    },
    
    // دریافت اندازه کش
    getCacheSize: async (cacheName) => {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        let size = 0;
        
        for (const request of keys) {
            const response = await cache.match(request);
            const blob = await response.blob();
            size += blob.size;
        }
        
        return size;
    },
    
    // دریافت آمار کش
    getCacheStats: async (cacheName) => {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        return {
            name: cacheName,
            count: keys.length,
            urls: keys.map(k => k.url)
        };
    }
};

// در دسترس قرار دادن
self.CacheStrategies = CacheStrategies;
