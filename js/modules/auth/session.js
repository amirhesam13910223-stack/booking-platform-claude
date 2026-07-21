 /* ============================================
   SESSION.JS - مدیریت نشست کاربر
   ============================================ */

const AuthSession = {
    // توکن فعلی
    token: null,
    
    // کاربر فعلی
    user: null,
    
    // زمان انقضای توکن (میلی‌ثانیه)
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 ساعت
    
    // تایمر بررسی نشست
    checkInterval: null,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        // بارگذاری نشست
        this.loadSession();
        
        // شروع بررسی دوره‌ای
        this.startSessionCheck();
        
        // گوش دادن به رویدادها
        App.on(SystemEvents.AUTH_LOGIN, (data) => {
            this.setSession(data.user);
        });
        
        App.on(SystemEvents.AUTH_LOGOUT, () => {
            this.clearSession();
        });
        
        console.log('⏱️ ماژول Session راه‌اندازی شد');
    },
    
    // ===== بارگذاری نشست =====
    loadSession: function() {
        // بررسی localStorage
        let token = localStorage.getItem('auth_token');
        let user = localStorage.getItem('user');
        
        // بررسی sessionStorage
        if (!token) {
            token = sessionStorage.getItem('auth_token');
            user = sessionStorage.getItem('user');
        }
        
        if (token && user) {
            try {
                this.token = token;
                this.user = JSON.parse(user);
                
                // بررسی انقضای توکن
                if (this.isTokenExpired()) {
                    console.warn('توکن منقضی شده است');
                    this.clearSession();
                } else {
                    console.log(`✅ نشست بازیابی شد: ${this.user.name}`);
                    StateManager.set('user', this.user, true);
                    StateManager.set('isLoggedIn', true, true);
                }
            } catch (e) {
                console.error('خطا در بارگذاری نشست:', e);
                this.clearSession();
            }
        }
    },
    
    // ===== تنظیم نشست =====
    setSession: function(user, remember = true) {
        this.user = user;
        this.token = user.token;
        
        // ذخیره زمان ایجاد توکن
        this.tokenCreatedAt = Date.now();
        
        if (remember) {
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            sessionStorage.setItem('auth_token', this.token);
            sessionStorage.setItem('user', JSON.stringify(user));
        }
        
        // به‌روزرسانی State
        StateManager.set('user', user);
        StateManager.set('isLoggedIn', true);
        
        // ارسال رویداد
        App.emit('session:created', { user });
        
        console.log(`🔐 نشست برای کاربر ${user.name} ایجاد شد`);
    },
    
    // ===== پاک کردن نشست =====
    clearSession: function() {
        this.user = null;
        this.token = null;
        this.tokenCreatedAt = null;
        
        // پاک کردن از storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user');
        
        // به‌روزرسانی State
        StateManager.set('user', null);
        StateManager.set('isLoggedIn', false);
        
        // ارسال رویداد
        App.emit('session:cleared');
        
        console.log('🔓 نشست پاک شد');
    },
    
    // ===== بررسی انقضای توکن =====
    isTokenExpired: function() {
        if (!this.tokenCreatedAt) {
            // تلاش برای بازیابی زمان ایجاد از localStorage
            const savedTime = localStorage.getItem('token_created_at');
            if (savedTime) {
                this.tokenCreatedAt = parseInt(savedTime);
            } else {
                return true;
            }
        }
        
        const elapsed = Date.now() - this.tokenCreatedAt;
        return elapsed > this.tokenExpiry;
    },
    
    // ===== شروع بررسی دوره‌ای نشست =====
    startSessionCheck: function() {
        // بررسی هر ۵ دقیقه
        this.checkInterval = setInterval(() => {
            if (this.isLoggedIn()) {
                if (this.isTokenExpired()) {
                    console.warn('نشست منقضی شد');
                    this.onSessionExpired();
                } else {
                    // تمدید خودکار نشست (در صورت فعال بودن)
                    this.refreshSession();
                }
            }
        }, 5 * 60 * 1000); // 5 دقیقه
    },
    
    // ===== تمدید نشست =====
    refreshSession: async function() {
        if (!this.token) return;
        
        try {
            // شبیه‌سازی درخواست تمدید توکن
            const response = await this.requestTokenRefresh();
            
            if (response.success) {
                this.tokenCreatedAt = Date.now();
                localStorage.setItem('token_created_at', this.tokenCreatedAt.toString());
                console.log('🔄 نشست تمدید شد');
            }
        } catch (error) {
            console.error('خطا در تمدید نشست:', error);
        }
    },
    
    // ===== درخواست تمدید توکن =====
    requestTokenRefresh: async function() {
        await this.delay(500);
        return { success: true };
    },
    
    // ===== انقضای نشست =====
    onSessionExpired: function() {
        App.showToast('نشست شما منقضی شده است. لطفاً دوباره وارد شوید', 'warning');
        this.clearSession();
        
        // هدایت به صفحه ورود
        if (window.Router) {
            Router.navigateTo('/login');
        }
        
        // ارسال رویداد
        App.emit('session:expired');
    },
    
    // ===== خروج از حساب =====
    logout: async function() {
        App.showToast('در حال خروج...', 'info');
        
        await this.delay(500);
        
        this.clearSession();
        App.showToast('از حساب خود خارج شدید', 'success');
        
        // هدایت به صفحه اصلی
        if (window.Router) {
            Router.navigateTo('/');
        }
        
        // به‌روزرسانی UI
        this.updateUIAfterLogout();
    },
    
    // ===== به‌روزرسانی UI پس از خروج =====
    updateUIAfterLogout: function() {
        // نمایش دکمه‌های ورود/ثبت‌نام
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (registerBtn) registerBtn.style.display = 'inline-flex';
        
        // حذف دکمه پروفایل
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.remove();
        }
        
        // حذف منوی باز شده
        const userMenu = document.querySelector('.user-menu-dropdown');
        if (userMenu) {
            userMenu.remove();
        }
    },
    
    // ===== بررسی وضعیت ورود =====
    isLoggedIn: function() {
        return !!(this.token && this.user);
    },
    
    // ===== دریافت توکن =====
    getToken: function() {
        return this.token;
    },
    
    // ===== دریافت کاربر =====
    getUser: function() {
        return this.user;
    },
    
    // ===== دریافت اطلاعات کاربر =====
    getUserInfo: function() {
        return this.user;
    },
    
    // ===== بررسی نقش کاربر =====
    hasRole: function(role) {
        return this.user && this.user.role === role;
    },
    
    // ===== بررسی دسترسی =====
    hasPermission: function(permission) {
        if (!this.user) return false;
        
        const permissions = {
            admin: ['*'],
            business: ['manage_bookings', 'view_reports', 'manage_staff'],
            user: ['view_bookings', 'create_booking', 'cancel_booking']
        };
        
        const userPermissions = permissions[this.user.role] || [];
        return userPermissions.includes('*') || userPermissions.includes(permission);
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // ===== توقف بررسی نشست =====
    stopSessionCheck: function() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
};

// مقداردهی اولیه
document.addEventListener('DOMContentLoaded', () => {
    AuthSession.init();
});

window.AuthSession = AuthSession;

// اضافه کردن دکمه خروج به window
window.logout = function() {
    AuthSession.logout();
};
