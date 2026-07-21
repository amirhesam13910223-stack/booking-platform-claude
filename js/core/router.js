 /* ============================================
   ROUTER.JS - مدیریت مسیرها (SPA)
   ============================================ */

const Router = {
    // مسیرها
    routes: {},
    
    // مسیر فعلی
    currentRoute: null,
    
    // المنت اصلی برای رندر
    outlet: null,
    
    // ===== مقداردهی اولیه =====
    init: function(outletId = 'app-outlet') {
        this.outlet = document.getElementById(outletId);
        
        // گوش دادن به تغییرات URL
        window.addEventListener('popstate', () => this.handleRoute());
        
        // مسیر اولیه
        this.handleRoute();
        
        console.log('🛣️ Router راه‌اندازی شد');
    },
    
    // ===== ثبت مسیر =====
    addRoute: function(path, handler, options = {}) {
        this.routes[path] = {
            handler: handler,
            title: options.title || 'پلتفرم نوبت‌دهی',
            auth: options.auth || false
        };
        console.log(`📍 مسیر ${path} ثبت شد`);
    },
    
    // ===== ناوبری به مسیر =====
    navigateTo: function(path, replace = false) {
        // بررسی احراز هویت
        const route = this.routes[path];
        if (route && route.auth && !App.isLoggedIn) {
            App.showToast('برای دسترسی به این بخش باید وارد شوید', 'warning');
            this.navigateTo('/login');
            return;
        }
        
        if (replace) {
            window.history.replaceState(null, '', path);
        } else {
            window.history.pushState(null, '', path);
        }
        
        this.handleRoute();
    },
    
    // ===== مدیریت مسیر =====
    handleRoute: async function() {
        const path = window.location.pathname;
        const route = this.routes[path] || this.routes['/404'] || this.routes['/'];
        
        if (route) {
            // به‌روزرسانی عنوان صفحه
            document.title = route.title;
            
            // اجرای handler
            if (typeof route.handler === 'function') {
                await route.handler();
            } else if (typeof route.handler === 'string') {
                await this.loadPage(route.handler);
            }
            
            this.currentRoute = path;
            
            // ارسال رویداد
            App.emit('route:changed', { path, route });
        } else {
            console.warn(`مسیر ${path} یافت نشد`);
        }
    },
    
    // ===== بارگذاری صفحه =====
    loadPage: async function(pagePath) {
        if (!this.outlet) return;
        
        try {
            // نمایش لودینگ
            this.showLoading();
            
            // بارگذاری صفحه
            const response = await fetch(`pages/${pagePath}.html`);
            if (!response.ok) throw new Error('صفحه یافت نشد');
            
            const html = await response.text();
            this.outlet.innerHTML = html;
            
            // اجرای اسکریپت‌های صفحه
            this.executeScripts();
            
            // مخفی کردن لودینگ
            this.hideLoading();
            
        } catch (error) {
            console.error('خطا در بارگذاری صفحه:', error);
            this.showError();
        }
    },
    
    // ===== نمایش لودینگ =====
    showLoading: function() {
        if (this.outlet) {
            this.outlet.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>در حال بارگذاری...</p>
                </div>
            `;
        }
    },
    
    // ===== مخفی کردن لودینگ =====
    hideLoading: function() {
        // لودینگ حذف می‌شود
    },
    
    // ===== نمایش خطا =====
    showError: function() {
        if (this.outlet) {
            this.outlet.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">😞</div>
                    <h3>خطا در بارگذاری صفحه</h3>
                    <p>لطفاً دوباره تلاش کنید</p>
                    <button class="btn btn-primary" onclick="location.reload()">تلاش مجدد</button>
                </div>
            `;
        }
    },
    
    // ===== اجرای اسکریپت‌های صفحه =====
    executeScripts: function() {
        const scripts = this.outlet.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    },
    
    // ===== دریافت پارامترهای URL =====
    getParams: function() {
        const params = {};
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        
        return params;
    },
    
    // ===== دریافت مسیر قبلی =====
    getPreviousRoute: function() {
        return this.previousRoute;
    },
    
    // ===== بازگشت به صفحه قبل =====
    goBack: function() {
        window.history.back();
    }
};

// مسیرهای پیش‌فرض
Router.addRoute('/', 'home', { title: 'خانه - پلتفرم نوبت‌دهی' });
Router.addRoute('/booking', 'booking', { title: 'رزرو نوبت', auth: false });
Router.addRoute('/reverse-market', 'reverse-market', { title: 'بازار معکوس' });
Router.addRoute('/plans', 'plans', { title: 'طرح‌ها' });
Router.addRoute('/business', 'business-dashboard', { title: 'پنل کسب‌وکار', auth: true });
Router.addRoute('/admin', 'admin-panel', { title: 'پنل مدیریت', auth: true });
Router.addRoute('/profile', 'profile', { title: 'پروفایل کاربری', auth: true });
Router.addRoute('/login', 'auth/login', { title: 'ورود به حساب' });
Router.addRoute('/register', 'auth/register', { title: 'ثبت‌نام' });
Router.addRoute('/404', '404', { title: 'صفحه یافت نشد' });

window.Router = Router;
