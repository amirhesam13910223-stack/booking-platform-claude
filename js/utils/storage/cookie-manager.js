/* ============================================
   COOKIE-MANAGER.JS - مدیریت کوکی‌ها
   ============================================ */

   const CookieManager = {
    // ===== تنظیم کوکی =====
    set: function(name, value, days = 7, path = '/') {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}; SameSite=Lax`;
    },
    
    // ===== تنظیم کوکی امن (HttpOnly-like) =====
    setSecure: function(name, value, days = 7, path = '/') {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}; Secure; SameSite=Strict`;
    },
    
    // ===== دریافت کوکی =====
    get: function(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    },
    
    // ===== حذف کوکی =====
    delete: function(name, path = '/') {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
    },
    
    // ===== بررسی وجود کوکی =====
    has: function(name) {
        return this.get(name) !== null;
    },
    
    // ===== دریافت همه کوکی‌ها =====
    getAll: function() {
        const cookies = {};
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            const eqPos = c.indexOf('=');
            const name = c.substring(0, eqPos);
            const value = decodeURIComponent(c.substring(eqPos + 1));
            cookies[name] = value;
        }
        return cookies;
    },
    
    // ===== تنظیم کوکی با اعتبار زمانی (ثانیه) =====
    setWithTTL: function(name, value, ttlSeconds, path = '/') {
        const expires = new Date();
        expires.setTime(expires.getTime() + (ttlSeconds * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}; SameSite=Lax`;
    },
    
    // ===== تنظیم کوکی برای جلسه =====
    setSession: function(name, value, path = '/') {
        document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; SameSite=Lax`;
    },
    
    // ===== ذخیره رضایت کوکی =====
    setConsent: function(accepted) {
        this.set('cookie_consent', accepted, 365);
    },
    
    // ===== بررسی رضایت کوکی =====
    hasConsent: function() {
        return this.get('cookie_consent') === 'true';
    },
    
    // ===== کوکی احراز هویت =====
    setAuthToken: function(token, remember = true) {
        if (remember) {
            this.setSecure('auth_token', token, 30);
        } else {
            this.setSession('auth_token', token);
        }
    },
    
    // ===== دریافت توکن احراز هویت =====
    getAuthToken: function() {
        return this.get('auth_token');
    },
    
    // ===== حذف توکن احراز هویت =====
    clearAuthToken: function() {
        this.delete('auth_token');
    },
    
    // ===== ذخیره تنظیمات کاربر =====
    setUserPreferences: function(preferences) {
        this.set('user_preferences', JSON.stringify(preferences), 365);
    },
    
    // ===== دریافت تنظیمات کاربر =====
    getUserPreferences: function() {
        const prefs = this.get('user_preferences');
        if (prefs) {
            try {
                return JSON.parse(prefs);
            } catch(e) {
                return {};
            }
        }
        return {};
    },
    
    // ===== پاک کردن همه کوکی‌ها =====
    clearAll: function() {
        const cookies = this.getAll();
        for (const name in cookies) {
            this.delete(name);
        }
    },
    
    // ===== دریافت اندازه کوکی‌ها =====
    getSize: function() {
        return document.cookie.length;
    }
};

window.CookieManager = CookieManager; 
