 /* ============================================
   TOKEN-MANAGER.JS - مدیریت توکن
   ============================================ */

const TokenManager = {
    // توکن فعلی
    currentToken: null,
    
    // زمان انقضا
    expiryTime: null,
    
    // ===== ذخیره توکن =====
    setToken: function(token, expiresIn = 86400) {
        this.currentToken = token;
        this.expiryTime = Date.now() + (expiresIn * 1000);
        
        // ذخیره در localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('token_expiry', this.expiryTime);
    },
    
    // ===== دریافت توکن =====
    getToken: function() {
        if (!this.currentToken) {
            this.currentToken = localStorage.getItem('auth_token');
            this.expiryTime = parseInt(localStorage.getItem('token_expiry'));
        }
        
        if (this.isExpired()) {
            this.clearToken();
            return null;
        }
        
        return this.currentToken;
    },
    
    // ===== بررسی انقضا =====
    isExpired: function() {
        if (!this.expiryTime) return true;
        return Date.now() >= this.expiryTime;
    },
    
    // ===== پاک کردن توکن =====
    clearToken: function() {
        this.currentToken = null;
        this.expiryTime = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_expiry');
    },
    
    // ===== تمدید توکن =====
    refreshToken: async function() {
        try {
            // درخواست تمدید توکن به سرور
            const response = await this.requestTokenRefresh();
            if (response.success) {
                this.setToken(response.token, response.expiresIn);
                return true;
            }
            return false;
        } catch (error) {
            console.error('خطا در تمدید توکن:', error);
            return false;
        }
    },
    
    // ===== درخواست تمدید توکن (شبیه‌سازی) =====
    requestTokenRefresh: async function() {
        // شبیه‌سازی درخواست به سرور
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            success: true,
            token: Encryption.generateToken(),
            expiresIn: 86400
        };
    },
    
    // ===== اعتبارسنجی توکن =====
    validateToken: function(token) {
        if (!token) return false;
        // بررسی فرمت توکن (مثال ساده)
        return token.length >= 20 && /^[A-Za-z0-9]+$/.test(token);
    },
    
    // ===== رمزگشایی توکن JWT (شبیه‌سازی) =====
    decodeJWT: function(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch(e) {
            console.error('خطا در رمزگشایی JWT:', e);
            return null;
        }
    },
    
    // ===== دریافت اطلاعات کاربر از توکن =====
    getUserFromToken: function() {
        const token = this.getToken();
        if (!token) return null;
        
        const decoded = this.decodeJWT(token);
        if (decoded) {
            return {
                id: decoded.userId,
                name: decoded.name,
                role: decoded.role
            };
        }
        return null;
    },
    
    // ===== بررسی نقش کاربر از توکن =====
    hasRole: function(role) {
        const user = this.getUserFromToken();
        return user && user.role === role;
    },
    
    // ===== بررسی دسترسی =====
    hasPermission: function(permission) {
        const token = this.getToken();
        if (!token) return false;
        
        const decoded = this.decodeJWT(token);
        if (!decoded) return false;
        
        const permissions = decoded.permissions || [];
        return permissions.includes(permission) || permissions.includes('*');
    },
    
    // ===== ذخیره توکن در حافظه امن =====
    setSecureToken: function(token) {
        const encrypted = Encryption.encryptSensitive(token);
        sessionStorage.setItem('secure_token', encrypted);
        this.currentToken = token;
    },
    
    // ===== دریافت توکن از حافظه امن =====
    getSecureToken: function() {
        if (this.currentToken) return this.currentToken;
        
        const encrypted = sessionStorage.getItem('secure_token');
        if (encrypted) {
            this.currentToken = Encryption.decryptSensitive(encrypted);
            return this.currentToken;
        }
        return null;
    },
    
    // ===== زمان باقی‌مانده تا انقضا =====
    getRemainingTime: function() {
        if (!this.expiryTime) return 0;
        const remaining = this.expiryTime - Date.now();
        return Math.max(0, remaining);
    },
    
    // ===== فرمت زمان باقی‌مانده =====
    getRemainingTimeFormatted: function() {
        const seconds = Math.floor(this.getRemainingTime() / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
};

window.TokenManager = TokenManager;
