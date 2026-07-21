 /* ============================================
   SESSIONSTORAGE.JS - مدیریت sessionStorage
   ============================================ */

const SessionStorageManager = {
    // ===== ذخیره مقدار =====
    set: function(key, value) {
        try {
            const serialized = JSON.stringify(value);
            sessionStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('خطا در ذخیره در sessionStorage:', error);
            return false;
        }
    },
    
    // ===== دریافت مقدار =====
    get: function(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error('خطا در دریافت از sessionStorage:', error);
            return defaultValue;
        }
    },
    
    // ===== حذف مقدار =====
    remove: function(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('خطا در حذف از sessionStorage:', error);
            return false;
        }
    },
    
    // ===== بررسی وجود =====
    has: function(key) {
        return sessionStorage.getItem(key) !== null;
    },
    
    // ===== پاک کردن همه =====
    clear: function() {
        try {
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('خطا در پاک کردن sessionStorage:', error);
            return false;
        }
    },
    
    // ===== دریافت همه کلیدها =====
    keys: function() {
        return Object.keys(sessionStorage);
    },
    
    // ===== تعداد آیتم‌ها =====
    size: function() {
        return sessionStorage.length;
    },
    
    // ===== ذخیره داده موقتی (با حذف خودکار پس از بستن تب) =====
    setTemporary: function(key, value) {
        return this.set(key, value);
    },
    
    // ===== ذخیره داده برای نیمکت جاری =====
    setTabData: function(key, value) {
        this.set(`tab_${key}`, value);
        
        // ذخیره زمان برای شناسایی تب
        if (!this.get('tab_id')) {
            this.set('tab_id', Date.now().toString());
        }
    },
    
    // ===== دریافت داده نیمکت =====
    getTabData: function(key, defaultValue = null) {
        return this.get(`tab_${key}`, defaultValue);
    },
    
    // ===== پاک کردن داده نیمکت =====
    clearTabData: function(key) {
        if (key) {
            this.remove(`tab_${key}`);
        } else {
            const keys = this.keys();
            keys.forEach(k => {
                if (k.startsWith('tab_')) {
                    this.remove(k);
                }
            });
        }
    },
    
    // ===== ذخیره فرم موقت (پیش‌نویس) =====
    saveFormDraft: function(formId, data) {
        this.set(`draft_${formId}`, {
            data: data,
            savedAt: new Date().toISOString()
        });
    },
    
    // ===== دریافت پیش‌نویس فرم =====
    getFormDraft: function(formId) {
        return this.get(`draft_${formId}`);
    },
    
    // ===== حذف پیش‌نویس فرم =====
    deleteFormDraft: function(formId) {
        this.remove(`draft_${formId}`);
    },
    
    // ===== ذخیره وضعیت صفحه (برای بازگشت پس از رفرش) =====
    savePageState: function(page, state) {
        this.set(`page_state_${page}`, {
            state: state,
            timestamp: Date.now()
        });
    },
    
    // ===== دریافت وضعیت صفحه =====
    getPageState: function(page) {
        const state = this.get(`page_state_${page}`);
        if (state && Date.now() - state.timestamp < 300000) { // 5 دقیقه اعتبار
            return state.state;
        }
        return null;
    },
    
    // ===== ذخیره هشدار یکبار مصرف =====
    setOnce: function(key, value) {
        if (!this.has(key)) {
            this.set(key, value);
            return true;
        }
        return false;
    },
    
    // ===== دریافت و حذف (یکبار مصرف) =====
    getOnce: function(key, defaultValue = null) {
        const value = this.get(key, defaultValue);
        this.remove(key);
        return value;
    },
    
    // ===== ذخیره با اعتبار زمانی =====
    setWithTTL: function(key, value, ttlSeconds = 3600) {
        this.set(key, {
            value: value,
            expiresAt: Date.now() + (ttlSeconds * 1000)
        });
    },
    
    // ===== دریافت با اعتبار زمانی =====
    getWithTTL: function(key, defaultValue = null) {
        const item = this.get(key);
        if (!item) return defaultValue;
        
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.remove(key);
            return defaultValue;
        }
        
        return item.value;
    },
    
    // ===== پاک کردن داده‌های قدیمی =====
    cleanExpired: function() {
        const keys = this.keys();
        let cleaned = 0;
        
        keys.forEach(key => {
            const item = this.get(key);
            if (item && item.expiresAt && Date.now() > item.expiresAt) {
                this.remove(key);
                cleaned++;
            }
        });
        
        return cleaned;
    },
    
    // ===== دریافت فضای استفاده شده =====
    getUsedSpace: function() {
        let total = 0;
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            total += (key.length + value.length) * 2;
        }
        return total;
    },
    
    // ===== فضای نام =====
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
            }
        };
    }
};

window.SessionStorageManager = SessionStorageManager;
