 /* ============================================
   CACHE-MANAGER.JS - مدیریت کش
   ============================================ */

const CacheManager = {
    // حافظه کش درون برنامه‌ای
    memoryCache: new Map(),
    
    // تنظیمات
    config: {
        defaultTTL: 3600000, // 1 ساعت
        maxSize: 100,        // حداکثر تعداد آیتم در حافظه
        cleanupInterval: 300000 // 5 دقیقه
    },
    
    // تایمر پاکسازی
    cleanupTimer: null,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.startCleanupTimer();
    },
    
    // ===== شروع تایمر پاکسازی =====
    startCleanupTimer: function() {
        if (this.cleanupTimer) clearInterval(this.cleanupTimer);
        this.cleanupTimer = setInterval(() => this.cleanup(), this.config.cleanupInterval);
    },
    
    // ===== ذخیره در کش =====
    set: function(key, value, ttl = this.config.defaultTTL) {
        // کنترل حجم کش
        if (this.memoryCache.size >= this.config.maxSize) {
            this.removeOldest();
        }
        
        this.memoryCache.set(key, {
            value: value,
            expiresAt: Date.now() + ttl,
            createdAt: Date.now()
        });
        
        // همچنین ذخیره در localStorage به عنوان پشتیبان
        this.persistToLocalStorage(key, value, ttl);
    },
    
    // ===== دریافت از کش =====
    get: function(key, defaultValue = null) {
        const item = this.memoryCache.get(key);
        
        if (item && Date.now() < item.expiresAt) {
            return item.value;
        }
        
        // اگر در حافظه نبود، از localStorage بررسی کن
        const persisted = this.getFromLocalStorage(key);
        if (persisted) {
            this.memoryCache.set(key, {
                value: persisted.value,
                expiresAt: persisted.expiresAt,
                createdAt: persisted.createdAt
            });
            return persisted.value;
        }
        
        this.memoryCache.delete(key);
        return defaultValue;
    },
    
    // ===== بررسی وجود =====
    has: function(key) {
        const item = this.memoryCache.get(key);
        if (item && Date.now() < item.expiresAt) {
            return true;
        }
        
        const persisted = this.getFromLocalStorage(key);
        if (persisted) {
            return true;
        }
        
        this.memoryCache.delete(key);
        return false;
    },
    
    // ===== حذف از کش =====
    delete: function(key) {
        this.memoryCache.delete(key);
        localStorage.removeItem(`cache_${key}`);
    },
    
    // ===== پاکسازی کش =====
    cleanup: function() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, item] of this.memoryCache.entries()) {
            if (now >= item.expiresAt) {
                this.memoryCache.delete(key);
                cleaned++;
            }
        }
        
        // پاکسازی localStorage
        this.cleanupLocalStorage();
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} آیتم از کش حذف شد`);
        }
    },
    
    // ===== پاکسازی کامل =====
    clear: function() {
        this.memoryCache.clear();
        this.clearLocalStorage();
    },
    
    // ===== حذف قدیمی‌ترین آیتم =====
    removeOldest: function() {
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, item] of this.memoryCache.entries()) {
            if (item.createdAt < oldestTime) {
                oldestTime = item.createdAt;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.memoryCache.delete(oldestKey);
        }
    },
    
    // ===== ذخیره در localStorage =====
    persistToLocalStorage: function(key, value, ttl) {
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify({
                value: value,
                expiresAt: Date.now() + ttl,
                createdAt: Date.now()
            }));
        } catch (e) {
            // اگر localStorage پر بود، قدیمی‌ترین کش را پاک کن
            this.cleanupLocalStorage(true);
            try {
                localStorage.setItem(`cache_${key}`, JSON.stringify({
                    value: value,
                    expiresAt: Date.now() + ttl,
                    createdAt: Date.now()
                }));
            } catch(e) {}
        }
    },
    
    // ===== دریافت از localStorage =====
    getFromLocalStorage: function(key) {
        try {
            const item = localStorage.getItem(`cache_${key}`);
            if (item) {
                const parsed = JSON.parse(item);
                if (Date.now() < parsed.expiresAt) {
                    return parsed;
                }
                localStorage.removeItem(`cache_${key}`);
            }
        } catch(e) {}
        return null;
    },
    
    // ===== پاکسازی localStorage =====
    cleanupLocalStorage: function(force = false) {
        const now = Date.now();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_')) {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (force || now >= item.expiresAt) {
                        localStorage.removeItem(key);
                    }
                } catch(e) {
                    localStorage.removeItem(key);
                }
            }
        }
    },
    
    // ===== پاکسازی کامل localStorage =====
    clearLocalStorage: function() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        }
    },
    
    // ===== دریافت آمار کش =====
    getStats: function() {
        let validCount = 0;
        let expiredCount = 0;
        const now = Date.now();
        
        for (const [key, item] of this.memoryCache.entries()) {
            if (now < item.expiresAt) {
                validCount++;
            } else {
                expiredCount++;
            }
        }
        
        return {
            memorySize: this.memoryCache.size,
            validItems: validCount,
            expiredItems: expiredCount,
            localStorageSize: this.getLocalStorageCacheCount()
        };
    },
    
    // ===== تعداد آیتم‌های کش در localStorage =====
    getLocalStorageCacheCount: function() {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).startsWith('cache_')) {
                count++;
            }
        }
        return count;
    },
    
    // ===== دریافت یا محاسبه (با تابع تولید) =====
    getOrCompute: async function(key, computeFn, ttl = this.config.defaultTTL) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        
        const value = await computeFn();
        this.set(key, value, ttl);
        return value;
    },
    
    // ===== تگ‌گذاری کش =====
    tag: function(key, tag) {
        const tags = this.get('__cache_tags__', {});
        if (!tags[tag]) tags[tag] = [];
        if (!tags[tag].includes(key)) tags[tag].push(key);
        this.set('__cache_tags__', tags, 86400000); // 24 ساعت
    },
    
    // ===== حذف بر اساس تگ =====
    invalidateTag: function(tag) {
        const tags = this.get('__cache_tags__', {});
        const keys = tags[tag] || [];
        keys.forEach(key => this.delete(key));
        delete tags[tag];
        this.set('__cache_tags__', tags, 86400000);
    }
};

// مقداردهی اولیه
CacheManager.init();

window.CacheManager = CacheManager;
