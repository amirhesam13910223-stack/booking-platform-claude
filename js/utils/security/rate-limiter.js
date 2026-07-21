 /* ============================================
   RATE-LIMITER.JS - محدودیت نرخ درخواست
   ============================================ */

const RateLimiter = {
    // رکوردهای درخواست
    requests: {},
    
    // تنظیمات پیش‌فرض
    config: {
        windowMs: 60000,      // 1 دقیقه
        maxRequests: 10,      // حداکثر 10 درخواست
        blockDuration: 300000 // 5 دقیقه مسدودیت
    },
    
    // آیپی‌های مسدود شده
    blockedIPs: {},
    
    // ===== تنظیمات =====
    setConfig: function(config) {
        this.config = { ...this.config, ...config };
    },
    
    // ===== بررسی محدودیت =====
    isAllowed: function(identifier, action = 'default') {
        const key = `${identifier}:${action}`;
        const now = Date.now();
        
        // بررسی مسدودیت
        if (this.blockedIPs[identifier] && this.blockedIPs[identifier] > now) {
            return { allowed: false, reason: 'blocked', remainingTime: this.blockedIPs[identifier] - now };
        }
        
        // پاک کردن رکوردهای قدیمی
        if (!this.requests[key]) {
            this.requests[key] = [];
        }
        
        this.requests[key] = this.requests[key].filter(timestamp => timestamp > now - this.config.windowMs);
        
        if (this.requests[key].length >= this.config.maxRequests) {
            // مسدود کردن آیپی
            this.blockIP(identifier);
            return { allowed: false, reason: 'rate_limit', limit: this.config.maxRequests, remaining: 0 };
        }
        
        this.requests[key].push(now);
        const remaining = this.config.maxRequests - this.requests[key].length;
        
        return { allowed: true, remaining: remaining, limit: this.config.maxRequests };
    },
    
    // ===== مسدود کردن آیپی =====
    blockIP: function(identifier, duration = this.config.blockDuration) {
        this.blockedIPs[identifier] = Date.now() + duration;
        console.warn(`🚫 IP ${identifier} مسدود شد به مدت ${duration / 1000} ثانیه`);
    },
    
    // ===== رفع مسدودیت =====
    unblockIP: function(identifier) {
        delete this.blockedIPs[identifier];
    },
    
    // ===== میدلور برای fetch =====
    fetchMiddleware: async function(url, options = {}, identifier, action = 'default') {
        const check = this.isAllowed(identifier, action);
        
        if (!check.allowed) {
            throw new Error(`Rate limit exceeded. ${check.reason === 'blocked' ? 'IP blocked' : 'Too many requests'}`);
        }
        
        return await fetch(url, options);
    },
    
    // ===== میدلور برای API =====
    apiMiddleware: function(handler) {
        return async (req, res, identifier, action = 'default') => {
            const check = this.isAllowed(identifier, action);
            
            if (!check.allowed) {
                return {
                    success: false,
                    error: check.reason === 'blocked' ? 'IP مسدود شده است' : 'تعداد درخواست بیش از حد مجاز',
                    retryAfter: Math.ceil((this.config.windowMs - (Date.now() - this.requests[`${identifier}:${action}`]?.[0])) / 1000)
                };
            }
            
            return await handler(req, res);
        };
    },
    
    // ===== دریافت وضعیت =====
    getStatus: function(identifier, action = 'default') {
        const key = `${identifier}:${action}`;
        const now = Date.now();
        
        if (!this.requests[key]) {
            return { remaining: this.config.maxRequests, resetTime: 0 };
        }
        
        this.requests[key] = this.requests[key].filter(timestamp => timestamp > now - this.config.windowMs);
        const remaining = this.config.maxRequests - this.requests[key].length;
        const oldestRequest = this.requests[key][0];
        const resetTime = oldestRequest ? oldestRequest + this.config.windowMs : 0;
        
        return { remaining: Math.max(0, remaining), resetTime: resetTime };
    },
    
    // ===== محدودیت اختصاصی برای لاگین =====
    loginLimiter: function(identifier) {
        return this.isAllowed(identifier, 'login');
    },
    
    // ===== محدودیت برای ثبت‌نام =====
    registerLimiter: function(identifier) {
        return this.isAllowed(identifier, 'register');
    },
    
    // ===== محدودیت برای ارسال پیامک =====
    smsLimiter: function(identifier) {
        return this.isAllowed(identifier, 'sms');
    },
    
    // ===== محدودیت برای API عمومی =====
    publicAPILimiter: function(identifier) {
        return this.isAllowed(identifier, 'public_api');
    },
    
    // ===== ریست رکوردهای یک کاربر =====
    resetUser: function(identifier) {
        for (const key in this.requests) {
            if (key.startsWith(identifier)) {
                delete this.requests[key];
            }
        }
        this.unblockIP(identifier);
    },
    
    // ===== پاک کردن همه رکوردها =====
    resetAll: function() {
        this.requests = {};
        this.blockedIPs = {};
    }
};

window.RateLimiter = RateLimiter;
