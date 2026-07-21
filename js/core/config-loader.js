 /* ============================================
   CONFIG-LOADER.JS - بارگذاری تنظیمات
   ============================================ */

const ConfigLoader = {
    // تنظیمات اصلی
    config: {
        // API
        api: {
            baseUrl: '/api',
            timeout: 30000,
            retryCount: 3,
            retryDelay: 1000
        },
        
        // درگاه‌های پرداخت
        payment: {
            defaultGateway: 'zarinpal',
            gateways: {
                zarinpal: { name: 'زرین‌پال', enabled: true },
                idpay: { name: 'آیدی‌پی', enabled: true },
                nextpay: { name: 'نکست‌پی', enabled: true },
                payir: { name: 'پی.آی آر', enabled: true },
                zibal: { name: 'زیبال', enabled: true },
                vandar: { name: 'وندار', enabled: true }
            }
        },
        
        // تخفیف‌ها
        discounts: {
            maxDiscount: 30,
            pointsPerBooking: 50,
            pointsPerReferral: 200
        },
        
        // نوبت‌ها
        booking: {
            minAdvanceTime: 1, // ساعت
            maxAdvanceDays: 30, // روز
            cancellationFee: {
                '24-48': 0,
                '12-24': 50,
                '0-12': 100
            }
        },
        
        // ظاهر
        ui: {
            theme: 'light',
            language: 'fa',
            animations: true,
            rtl: true
        },
        
        // اعلانات
        notifications: {
            enabled: true,
            sound: true,
            duration: 3000
        },
        
        // ویژگی‌های خاص
        features: {
            reverseMarket: true,
            loyaltyProgram: true,
            groupBooking: true,
            pwa: true
        }
    },
    
    // ===== بارگذاری تنظیمات =====
    load: async function() {
        console.log('⚙️ بارگذاری تنظیمات...');
        
        // بارگذاری از localStorage
        this.loadFromLocalStorage();
        
        // بارگذاری از سرور (در آینده)
        // await this.loadFromServer();
        
        // اعمال تنظیمات
        this.applyConfig();
        
        console.log('✅ تنظیمات بارگذاری شد', this.config);
        return this.config;
    },
    
    // ===== بارگذاری از localStorage =====
    loadFromLocalStorage: function() {
        const savedConfig = localStorage.getItem('app_config');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                this.config = this.deepMerge(this.config, parsed);
            } catch (e) {
                console.error('خطا در بارگذاری تنظیمات از localStorage:', e);
            }
        }
        
        // بارگذاری تم
        const theme = localStorage.getItem('theme');
        if (theme) {
            this.config.ui.theme = theme;
        }
        
        // بارگذاری زبان
        const language = localStorage.getItem('language');
        if (language) {
            this.config.ui.language = language;
        }
    },
    
    // ===== ذخیره در localStorage =====
    saveToLocalStorage: function() {
        const toSave = {
            ui: {
                theme: this.config.ui.theme,
                language: this.config.ui.language,
                animations: this.config.ui.animations
            },
            notifications: this.config.notifications
        };
        
        localStorage.setItem('app_config', JSON.stringify(toSave));
        localStorage.setItem('theme', this.config.ui.theme);
        localStorage.setItem('language', this.config.ui.language);
    },
    
    // ===== دریافت مقدار =====
    get: function(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    },
    
    // ===== تنظیم مقدار =====
    set: function(path, value, save = true) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        
        if (save) {
            this.saveToLocalStorage();
            this.applyConfig();
        }
        
        // ارسال رویداد
        App.emit('config:changed', { path, value });
        
        return true;
    },
    
    // ===== اعمال تنظیمات =====
    applyConfig: function() {
        // اعمال تم
        const html = document.documentElement;
        if (this.config.ui.theme === 'dark') {
            html.classList.add('dark-theme');
        } else {
            html.classList.remove('dark-theme');
        }
        
        // اعمال جهت صفحه
        if (this.config.ui.rtl) {
            document.documentElement.setAttribute('dir', 'rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
        }
        
        // اعمال زبان
        document.documentElement.setAttribute('lang', this.config.ui.language);
        
        // اعمال انیمیشن‌ها
        if (!this.config.ui.animations) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
        
        console.log('🎨 تنظیمات اعمال شد');
    },
    
    // ===== دریافت تنظیمات درگاه پرداخت =====
    getPaymentGateways: function() {
        const gateways = this.config.payment.gateways;
        return Object.entries(gateways)
            .filter(([_, g]) => g.enabled)
            .map(([key, g]) => ({ id: key, ...g }));
    },
    
    // ===== بررسی فعال بودن ویژگی =====
    isFeatureEnabled: function(feature) {
        return this.config.features[feature] === true;
    },
    
    // ===== ادغام عمیق اشیاء =====
    deepMerge: function(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    },
    
    // ===== ریست به تنظیمات پیش‌فرض =====
    reset: function() {
        // ذخیره تم و زبان فعلی
        const currentTheme = this.config.ui.theme;
        const currentLanguage = this.config.ui.language;
        
        // بازنشانی تنظیمات پیش‌فرض
        this.config = {
            api: { baseUrl: '/api', timeout: 30000, retryCount: 3, retryDelay: 1000 },
            payment: {
                defaultGateway: 'zarinpal',
                gateways: {
                    zarinpal: { name: 'زرین‌پال', enabled: true },
                    idpay: { name: 'آیدی‌پی', enabled: true },
                    nextpay: { name: 'نکست‌پی', enabled: true },
                    payir: { name: 'پی.آی آر', enabled: true },
                    zibal: { name: 'زیبال', enabled: true },
                    vandar: { name: 'وندار', enabled: true }
                }
            },
            discounts: { maxDiscount: 30, pointsPerBooking: 50, pointsPerReferral: 200 },
            booking: { minAdvanceTime: 1, maxAdvanceDays: 30, cancellationFee: { '24-48': 0, '12-24': 50, '0-12': 100 } },
            ui: { theme: currentTheme, language: currentLanguage, animations: true, rtl: true },
            notifications: { enabled: true, sound: true, duration: 3000 },
            features: { reverseMarket: true, loyaltyProgram: true, groupBooking: true, pwa: true }
        };
        
        this.saveToLocalStorage();
        this.applyConfig();
        
        App.showToast('تنظیمات به حالت پیش‌فرض بازنشانی شد', 'info');
    }
};

// در دسترس قرار دادن
window.ConfigLoader = ConfigLoader;
