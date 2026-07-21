 /* ============================================
   STRING-HELPER.JS - توابع کمکی رشته
   ============================================ */

const StringHelper = {
    // ===== کوتاه کردن متن =====
    truncate: function(str, length = 50, suffix = '...') {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.substring(0, length) + suffix;
    },
    
    // ===== تبدیل به حروف بزرگ =====
    toUpperCase: function(str) {
        if (!str) return '';
        return str.toUpperCase();
    },
    
    // ===== تبدیل به حروف کوچک =====
    toLowerCase: function(str) {
        if (!str) return '';
        return str.toLowerCase();
    },
    
    // ===== حذف فاصله‌های اضافی =====
    trim: function(str) {
        if (!str) return '';
        return str.trim().replace(/\s+/g, ' ');
    },
    
    // ===== تبدیل به اسلاگ (برای URL) =====
    toSlug: function(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    },
    
    // ===== معکوس کردن رشته =====
    reverse: function(str) {
        if (!str) return '';
        return str.split('').reverse().join('');
    },
    
    // ===== بررسی خالی بودن =====
    isEmpty: function(str) {
        return !str || str.trim() === '';
    },
    
    // ===== استخراج اعداد از رشته =====
    extractNumbers: function(str) {
        if (!str) return '';
        return str.replace(/[^0-9]/g, '');
    },
    
    // ===== استخراج حروف از رشته =====
    extractLetters: function(str) {
        if (!str) return '';
        return str.replace(/[^a-zA-Z\u0600-\u06FF]/g, '');
    },
    
    // ===== بررسی وجود کلمه در متن =====
    contains: function(str, search) {
        if (!str || !search) return false;
        return str.toLowerCase().includes(search.toLowerCase());
    },
    
    // ===== شروع شدن با =====
    startsWith: function(str, search) {
        if (!str || !search) return false;
        return str.toLowerCase().startsWith(search.toLowerCase());
    },
    
    // ===== پایان یافتن با =====
    endsWith: function(str, search) {
        if (!str || !search) return false;
        return str.toLowerCase().endsWith(search.toLowerCase());
    },
    
    // ===== جایگزینی متن =====
    replaceAll: function(str, search, replacement) {
        if (!str) return '';
        return str.split(search).join(replacement);
    },
    
    // ===== شمارش کلمات =====
    wordCount: function(str) {
        if (!str) return 0;
        return str.trim().split(/\s+/).length;
    },
    
    // ===== شمارش کاراکترها =====
    charCount: function(str) {
        if (!str) return 0;
        return str.length;
    },
    
    // ===== کپیتالایز کردن (حرف اول بزرگ) =====
    capitalize: function(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    // ===== کپیتالایز کردن هر کلمه =====
    capitalizeWords: function(str) {
        if (!str) return '';
        return str.split(' ').map(word => this.capitalize(word)).join(' ');
    },
    
    // ===== ماسک کردن متن (مثلاً برای شماره کارت) =====
    mask: function(str, start = 0, end = 0, maskChar = '*') {
        if (!str) return '';
        const length = str.length;
        const visibleStart = str.substring(0, start);
        const visibleEnd = str.substring(length - end);
        const maskedLength = length - start - end;
        const masked = maskChar.repeat(maskedLength);
        return visibleStart + masked + visibleEnd;
    },
    
    // ===== تولید رشته تصادفی =====
    random: function(length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    // ===== کد یکتا =====
    uniqueId: function(prefix = '') {
        return prefix + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },
    
    // ===== بررسی ایمیل معتبر =====
    isValidEmail: function(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    // ===== بررسی شماره تلفن معتبر =====
    isValidPhone: function(phone) {
        const regex = /^09[0-9]{9}$/;
        return regex.test(phone);
    },
    
    // ===== بررسی کد ملی معتبر =====
    isValidNationalCode: function(code) {
        if (!code || code.length !== 10) return false;
        const check = parseInt(code[9]);
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(code[i]) * (10 - i);
        }
        const remainder = sum % 11;
        return remainder < 2 ? check === remainder : check === 11 - remainder;
    },
    
    // ===== رمزنگاری ساده Base64 =====
    encodeBase64: function(str) {
        return btoa(unescape(encodeURIComponent(str)));
    },
    
    // ===== رمزگشایی Base64 =====
    decodeBase64: function(str) {
        return decodeURIComponent(escape(atob(str)));
    },
    
    // ===== حذف HTML تگ‌ها =====
    stripHtml: function(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '');
    },
    
    // ===== تبدیل به HTML امن =====
    escapeHtml: function(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
};

window.StringHelper = StringHelper;
