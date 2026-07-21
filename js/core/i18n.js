 /* ============================================
   I18N.JS - سیستم چندزبانی (بین‌المللی‌سازی)
   ============================================ */

const I18n = {
    // زبان فعلی
    currentLocale: 'fa',
    
    // بارگذاری شده‌های زبان
    translations: {},
    
    // زبان‌های پشتیبانی شده
    supportedLocales: ['fa', 'en'],
    
    // نام زبان‌ها
    localeNames: {
        fa: 'فارسی',
        en: 'English'
    },
    
    // ===== مقداردهی اولیه =====
    init: async function() {
        // بارگذاری زبان ذخیره شده
        const savedLocale = localStorage.getItem('language');
        if (savedLocale && this.supportedLocales.includes(savedLocale)) {
            this.currentLocale = savedLocale;
        }
        
        // بارگذاری فایل‌های زبان
        await this.loadTranslations(this.currentLocale);
        
        // اعمال زبان
        this.applyLocale();
        
        // گوش دادن به رویداد تغییر زبان
        App.on('language:change', (data) => {
            this.setLocale(data.locale);
        });
        
        console.log(`🌐 سیستم چندزبانی راه‌اندازی شد (زبان: ${this.localeNames[this.currentLocale]})`);
    },
    
    // ===== بارگذاری ترجمه‌ها =====
    loadTranslations: async function(locale) {
        try {
            // بارگذاری فایل‌های JSON
            const common = await this.loadJSON(`/locales/${locale}/common.json`);
            const auth = await this.loadJSON(`/locales/${locale}/auth.json`);
            const booking = await this.loadJSON(`/locales/${locale}/booking.json`);
            const business = await this.loadJSON(`/locales/${locale}/business.json`);
            const errors = await this.loadJSON(`/locales/${locale}/errors.json`);
            
            this.translations[locale] = {
                ...common,
                ...auth,
                ...booking,
                ...business,
                ...errors
            };
        } catch (error) {
            console.error(`خطا در بارگذاری ترجمه‌های ${locale}:`, error);
        }
    },
    
    // ===== بارگذاری فایل JSON =====
    loadJSON: async function(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    },
    
    // ===== دریافت ترجمه =====
    t: function(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLocale];
        
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                console.warn(`ترجمه برای کلید "${key}" یافت نشد`);
                return key;
            }
        }
        
        // جایگزینی پارامترها
        if (typeof value === 'string') {
            for (const [paramKey, paramValue] of Object.entries(params)) {
                value = value.replace(`{${paramKey}}`, paramValue);
            }
        }
        
        return value;
    },
    
    // ===== تغییر زبان =====
    setLocale: async function(locale) {
        if (!this.supportedLocales.includes(locale)) {
            console.warn(`زبان ${locale} پشتیبانی نمی‌شود`);
            return false;
        }
        
        if (locale === this.currentLocale) return true;
        
        // بارگذاری ترجمه‌های زبان جدید
        if (!this.translations[locale]) {
            await this.loadTranslations(locale);
        }
        
        this.currentLocale = locale;
        localStorage.setItem('language', locale);
        
        // اعمال زبان
        this.applyLocale();
        
        // بروزرسانی جهت صفحه
        document.documentElement.lang = locale === 'fa' ? 'fa-IR' : 'en-US';
        document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
        
        // ارسال رویداد
        App.emit('locale:changed', { locale });
        
        console.log(`زبان به ${this.localeNames[locale]} تغییر کرد`);
        return true;
    },
    
    // ===== اعمال زبان در DOM =====
    applyLocale: function() {
        // ترجمه عناصر با داده-ترجمه
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation) {
                element.textContent = translation;
            }
        });
        
        // ترجمه placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation) {
                element.placeholder = translation;
            }
        });
        
        // ترجمه title
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.t(key);
            if (translation) {
                element.title = translation;
            }
        });
    },
    
    // ===== دریافت زبان فعلی =====
    getLocale: function() {
        return this.currentLocale;
    },
    
    // ===== دریافت لیست زبان‌ها =====
    getLocales: function() {
        return this.supportedLocales.map(locale => ({
            code: locale,
            name: this.localeNames[locale]
        }));
    },
    
    // ===== نمایش انتخابگر زبان =====
    showLanguageSelector: function() {
        const locales = this.getLocales();
        
        const selector = document.createElement('div');
        selector.className = 'language-selector';
        
        locales.forEach(locale => {
            const button = document.createElement('button');
            button.className = `lang-btn ${locale.code === this.currentLocale ? 'active' : ''}`;
            button.textContent = locale.name;
            button.addEventListener('click', () => {
                this.setLocale(locale.code);
                selector.remove();
            });
            selector.appendChild(button);
        });
        
        return selector;
    },
    
    // ===== فرمت اعداد =====
    formatNumber: function(number, options = {}) {
        return new Intl.NumberFormat(this.currentLocale === 'fa' ? 'fa-IR' : 'en-US', options).format(number);
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (this.currentLocale === 'fa') {
            return price.toLocaleString('fa-IR') + ' تومان';
        }
        return price.toLocaleString('en-US') + ' IRR';
    },
    
    // ===== فرمت تاریخ =====
    formatDate: function(date, options = {}) {
        return new Intl.DateTimeFormat(this.currentLocale === 'fa' ? 'fa-IR' : 'en-US', options).format(new Date(date));
    }
};

// مقداردهی اولیه
document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
});

window.I18n = I18n;
