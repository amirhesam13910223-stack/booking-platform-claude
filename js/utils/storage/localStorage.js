/* ============================================
   LOCALSTORAGE.JS - مدیریت localStorage
   ============================================ */

   const LocalStorageManager = {
    // ===== ذخیره مقدار =====
    set: function(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('خطا در ذخیره در localStorage:', error);
            return false;
        }
    },
    
    // ===== دریافت مقدار =====
    get: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error('خطا در دریافت از localStorage:', error);
            return defaultValue;
        }
    },
    
    // ===== حذف مقدار =====
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('خطا در حذف از localStorage:', error);
            return false;
        }
    },
    
    // ===== بررسی وجود =====
    has: function(key) {
        return localStorage.getItem(key) !== null;
    },
    
    // ===== پاک کردن همه =====
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('خطا در پاک کردن localStorage:', error);
            return false;
        }
    },
    
    // ===== دریافت همه کلیدها =====
    keys: function() {
        return Object.keys(localStorage);
    },
    
    // ===== تعداد آیتم‌ها =====
    size: function() {
        return localStorage.length;
    },
    
    // ===== ذخیره با زمان انقضا =====
    setWithExpiry: function(key, value, expiryMs) {
        const item = {
            value: value,
            expiry: Date.now() + expiryMs
        };
        return this.set(key, item);
    },
    
    // ===== دریافت با بررسی انقضا =====
    getWithExpiry: function(key, defaultValue = null) {
        const item = this.get(key);
        if (!item) return defaultValue;
        
        if (item.expiry && Date.now() > item.expiry) {
            this.remove(key);
            return defaultValue;
        }
        
        return item.value;
    },
    
    // ===== ذخیره با رمزنگاری =====
    setSecure: function(key, value) {
        if (window.Encryption) {
            const encrypted = window.Encryption.encryptSensitive(value);
            return this.set(key, encrypted);
        }
        return this.set(key, value);
    },
    
    // ===== دریافت با رمزگشایی =====
    getSecure: function(key, defaultValue = null) {
        const encrypted = this.get(key);
        if (!encrypted) return defaultValue;
        
        if (window.Encryption) {
            return window.Encryption.decryptSensitive(encrypted);
        }
        return encrypted;
    },
    
    // ===== ذخیره با فضای نام =====
    namespace: function(namespace) {
        return {
            set: (key, value) => this.set(`${namespace}.${key}`, value),
            get: (key, defaultValue) => this.get(`${namespace}.${key}`, defaultValue),
            remove: (key) => this.remove(`${namespace}.${key}`),
            has: (key) => this.has(`${namespace}.${key}`),
            clear: () => {
                const keys = this.keys();
                keys.forEach(k => {
                    if (k.startsWith(`${namespace}.`)) {
                        this.remove(k);
                    }
                });
            },
            keys: () => {
                const keys = this.keys();
                return keys.filter(k => k.startsWith(`${namespace}.`)).map(k => k.replace(`${namespace}.`, ''));
            }
        };
    },
    
    // ===== دریافت فضای استفاده شده =====
    getUsedSpace: function() {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            total += (key.length + value.length) * 2; // تخمین تقریبی
        }
        return total;
    },
    
    // ===== دریافت حجم قابل استفاده =====
    getRemainingSpace: function() {
        const used = this.getUsedSpace();
        const limit = 5 * 1024 * 1024; // 5MB
        return Math.max(0, limit - used);
    },
    
    // ===== پشتیبان‌گیری =====
    backup: function() {
        const backup = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            backup[key] = localStorage.getItem(key);
        }
        return backup;
    },
    
    // ===== بازیابی از پشتیبان =====
    restore: function(backup) {
        this.clear();
        for (const [key, value] of Object.entries(backup)) {
            localStorage.setItem(key, value);
        }
    },
    
    // ===== صادرات به JSON =====
    exportToJSON: function() {
        return JSON.stringify(this.backup(), null, 2);
    },
    
    // ===== واردات از JSON =====
    importFromJSON: function(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.restore(data);
            return true;
        } catch (error) {
            console.error('خطا در واردات:', error);
            return false;
        }
    }
};

window.LocalStorageManager = LocalStorageManager; 
