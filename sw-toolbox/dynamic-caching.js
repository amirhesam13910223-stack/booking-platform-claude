 /* ============================================
   DYNAMIC-CACHING.JS - کش پویا
   ============================================ */

const DynamicCaching = {
    // حداکثر تعداد آیتم در کش
    maxItems: 100,
    
    // زمان انقضای کش (میلی‌ثانیه)
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 روز
    
    // ===== کش کردن پاسخ پویا =====
    cacheDynamicResponse: async (request, response, cacheName) => {
        const cache = await caches.open(cacheName);
        
        // بررسی محدودیت تعداد
        const keys = await cache.keys();
        if (keys.length >= DynamicCaching.maxItems) {
            // حذف قدیمی‌ترین آیتم
            const oldest = keys.reduce((oldest, key) => {
                return oldest < key ? oldest : key;
            });
            await cache.delete(oldest);
        }
        
        // ذخیره با زمان انقضا
        const cachedResponse = response.clone();
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Cache-Date', Date.now().toString());
        headers.set('X-Cache-TTL', DynamicCaching.ttl.toString());
        
        const newResponse = new Response(cachedResponse.body, {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers: headers
        });
        
        await cache.put(request, newResponse);
    },
    
    // ===== بررسی اعتبار کش =====
    isCacheValid: async (request, cacheName) => {
        const cache = await caches.open(cacheName);
        const response = await cache.match(request);
        
        if (!response) return false;
        
        const cacheDate = response.headers.get('X-Cache-Date');
        if (!cacheDate) return true;
        
        const age = Date.now() - parseInt(cacheDate);
        const ttl = parseInt(response.headers.get('X-Cache-TTL')) || DynamicCaching.ttl;
        
        return age < ttl;
    },
    
    // ===== کش کردن بر اساس نوع محتوا =====
    cacheByContentType: async (request, response, cacheName) => {
        const contentType = response.headers.get('Content-Type');
        
        if (contentType && contentType.includes('image/')) {
            await DynamicCaching.cacheDynamicResponse(request, response, `${cacheName}-images`);
        } else if (contentType && contentType.includes('application/json')) {
            await DynamicCaching.cacheDynamicResponse(request, response, `${cacheName}-api`);
        } else if (contentType && contentType.includes('text/html')) {
            await DynamicCaching.cacheDynamicResponse(request, response, `${cacheName}-pages`);
        } else {
            await DynamicCaching.cacheDynamicResponse(request, response, `${cacheName}-others`);
        }
    },
    
    // ===== به‌روزرسانی کش در پس‌زمینه =====
    backgroundUpdate: async (request, cacheName) => {
        try {
            const response = await fetch(request);
            if (response.ok) {
                await DynamicCaching.cacheDynamicResponse(request, response, cacheName);
            }
        } catch (error) {
            console.error('Background update failed:', error);
        }
    },
    
    // ===== پیش‌کش کردن API =====
    precacheAPI: async (urls, cacheName) => {
        const cache = await caches.open(cacheName);
        
        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                }
            } catch (error) {
                console.error(`Failed to precache ${url}:`, error);
            }
        }
    },
    
    // ===== حذف کش منقضی شده =====
    cleanExpiredCache: async (cacheName) => {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
            const response = await cache.match(request);
            const cacheDate = response.headers.get('X-Cache-Date');
            
            if (cacheDate) {
                const age = Date.now() - parseInt(cacheDate);
                const ttl = parseInt(response.headers.get('X-Cache-TTL')) || DynamicCaching.ttl;
                
                if (age >= ttl) {
                    await cache.delete(request);
                }
            }
        }
    },
    
    // ===== دریافت اندازه کش =====
    getCacheSize: async (cacheName) => {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        let totalSize = 0;
        
        for (const request of keys) {
            const response = await cache.match(request);
            const blob = await response.blob();
            totalSize += blob.size;
        }
        
        return totalSize;
    },
    
    // ===== دریافت آمار کش =====
    getDynamicCacheStats: async () => {
        const cacheNames = await caches.keys();
        const stats = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            
            stats[cacheName] = {
                count: keys.length,
                size: await DynamicCaching.getCacheSize(cacheName)
            };
        }
        
        return stats;
    },
    
    // ===== پاک کردن همه کش‌ها =====
    clearAllCaches: async () => {
        const cacheNames = await caches.keys();
        return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
    }
};

// در دسترس قرار دادن
self.DynamicCaching = DynamicCaching;
