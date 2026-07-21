 /* ============================================
   APP.JS - هسته اصلی برنامه
   ============================================ */

// آبجکت اصلی برنامه
const App = {
    // نسخه برنامه
    version: '1.0.0',
    
    // وضعیت برنامه
    initialized: false,
    
    // ماژول‌های بارگذاری شده
    modules: {},
    
    // تنظیمات برنامه
    config: {
        apiUrl: '/api',
        debug: true,
        defaultTheme: 'light',
        defaultLanguage: 'fa',
        timezone: 'Asia/Tehran'
    },
    
    // ===== مقداردهی اولیه =====
    init: async function() {
        if (this.initialized) {
            console.warn('برنامه قبلاً مقداردهی شده است');
            return;
        }
        
        console.log('🚀 راه‌اندازی پلتفرم نوبت‌دهی...');
        
        try {
            // بارگذاری تنظیمات
            await this.loadConfig();
            
            // راه‌اندازی EventBus
            if (window.EventBus) {
                this.eventBus = window.EventBus;
                console.log('✅ EventBus راه‌اندازی شد');
            }
            
            // راه‌اندازی StateManager
            if (window.StateManager) {
                this.state = window.StateManager;
                console.log('✅ StateManager راه‌اندازی شد');
            }
            
            // راه‌اندازی Router
            if (window.Router) {
                this.router = window.Router;
                console.log('✅ Router راه‌اندازی شد');
            }
            
            // راه‌اندازی تم
            this.initTheme();
            
            // راه‌اندازی رویدادها
            this.initEvents();
            
            // بررسی احراز هویت
            this.checkAuth();
            
            this.initialized = true;
            console.log('✅ برنامه با موفقیت راه‌اندازی شد');
            
            // ارسال رویداد راه‌اندازی
            this.emit('app:ready');
            
        } catch (error) {
            console.error('❌ خطا در راه‌اندازی برنامه:', error);
            this.showError('خطا در راه‌اندازی برنامه');
        }
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: async function() {
        // بارگذاری از localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.config.defaultTheme = savedTheme;
        }
        
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
            this.config.defaultLanguage = savedLanguage;
        }
        
        // بارگذاری تنظیمات از فایل کانفیگ
        if (window.AppConfig) {
            this.config = { ...this.config, ...window.AppConfig };
        }
        
        console.log('📋 تنظیمات بارگذاری شد:', this.config);
    },
    
    // ===== راه‌اندازی تم =====
    initTheme: function() {
        const theme = this.config.defaultTheme;
        const html = document.documentElement;
        
        if (theme === 'dark') {
            html.classList.add('dark-theme');
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) themeToggle.textContent = '☀️';
        } else {
            html.classList.remove('dark-theme');
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) themeToggle.textContent = '🌙';
        }
        
        console.log(`🎨 تم ${theme} فعال شد`);
    },
    
    // ===== تغییر تم =====
    toggleTheme: function() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark-theme');
        
        if (isDark) {
            html.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            this.config.defaultTheme = 'light';
            this.showToast('تم روشن فعال شد', 'success');
        } else {
            html.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            this.config.defaultTheme = 'dark';
            this.showToast('تم تاریک فعال شد', 'success');
        }
        
        this.emit('theme:changed', { theme: this.config.defaultTheme });
    },
    
    // ===== راه‌اندازی رویدادها =====
    initEvents: function() {
        // دکمه تغییر تم
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // منو موبایل
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const mainNav = document.getElementById('mainNav');
        if (mobileToggle && mainNav) {
            mobileToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });
        }
        
        // بستن منو با کلیک خارج
        document.addEventListener('click', (e) => {
            if (mainNav && mobileToggle) {
                if (!mainNav.contains(e.target) && !mobileToggle.contains(e.target)) {
                    mainNav.classList.remove('active');
                    mobileToggle.classList.remove('active');
                }
            }
        });
        
        // دکمه‌های CTA
        const ctaBtn = document.getElementById('ctaRegisterBtn');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', () => {
                this.openModal('registerModal');
            });
        }
        
        console.log('🎯 رویدادها راه‌اندازی شدند');
    },
    
    // ===== بررسی احراز هویت =====
    checkAuth: function() {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                this.currentUser = JSON.parse(user);
                this.isLoggedIn = true;
                console.log('👤 کاربر وارد شده:', this.currentUser.name);
                this.updateUIForLoggedInUser();
            } catch (e) {
                console.error('خطا در解析 اطلاعات کاربر');
            }
        } else {
            this.isLoggedIn = false;
            this.currentUser = null;
        }
        
        this.emit('auth:checked', { isLoggedIn: this.isLoggedIn });
    },
    
    // ===== به‌روزرسانی UI برای کاربر وارد شده =====
    updateUIForLoggedInUser: function() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (loginBtn && registerBtn && this.currentUser) {
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
            
            // اضافه کردن دکمه پروفایل
            const headerActions = document.querySelector('.header-actions');
            if (headerActions && !document.getElementById('userMenuBtn')) {
                const userBtn = document.createElement('button');
                userBtn.id = 'userMenuBtn';
                userBtn.className = 'btn btn-outline';
                userBtn.innerHTML = `👤 ${this.currentUser.name.split(' ')[0]}`;
                userBtn.addEventListener('click', () => this.openModal('userMenuModal'));
                headerActions.appendChild(userBtn);
            }
        }
    },
    
    // ===== باز کردن مودال =====
    openModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.emit('modal:opened', { modalId });
        }
    },
    
    // ===== بستن مودال =====
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.emit('modal:closed', { modalId });
        }
    },
    
    // ===== نمایش توست =====
    showToast: function(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || '✅'}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // انیمیشن نمایش
        setTimeout(() => toast.classList.add('show'), 10);
        
        // بستن خودکار بعد از 3 ثانیه
        const timeout = setTimeout(() => {
            this.closeToast(toast);
        }, 3000);
        
        // دکمه بستن
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                clearTimeout(timeout);
                this.closeToast(toast);
            });
        }
        
        this.emit('toast:shown', { message, type });
    },
    
    // ===== بستن توست =====
    closeToast: function(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },
    
    // ===== نمایش خطا =====
    showError: function(message) {
        console.error(message);
        this.showToast(message, 'error');
        this.emit('error:occurred', { message });
    },
    
    // ===== ارسال رویداد =====
    emit: function(event, data = {}) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        } else {
            // fallback
            const customEvent = new CustomEvent(event, { detail: data });
            document.dispatchEvent(customEvent);
        }
    },
    
    // ===== گوش دادن به رویداد =====
    on: function(event, callback) {
        if (this.eventBus) {
            this.eventBus.on(event, callback);
        } else {
            document.addEventListener(event, (e) => callback(e.detail));
        }
    },
    
    // ===== ثبت ماژول =====
    registerModule: function(name, module) {
        this.modules[name] = module;
        console.log(`📦 ماژول ${name} ثبت شد`);
        this.emit('module:registered', { name });
    },
    
    // ===== دریافت ماژول =====
    getModule: function(name) {
        return this.modules[name];
    }
};

// راه‌اندازی خودکار پس از بارگذاری کامل صفحه
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// در دسترس قرار دادن برای سایر ماژول‌ها
window.App = App;
