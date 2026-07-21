 /* ============================================
   EMAIL-VALIDATOR.JS - اعتبارسنجی ایمیل
   ============================================ */

const EmailValidator = {
    // الگوی ایمیل
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    
    // دامنه‌های معتبر
    validDomains: [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'icloud.com', 'protonmail.com', 'mail.com', 'yandex.com',
        'gmx.com', 'zoho.com', 'aol.com', 'mail.ru'
    ],
    
    // دامنه‌های ایرانی
    iranianDomains: [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'chmail.ir', 'mailfa.com', 'parsun.ir', 'iran.ir',
        'tebyan.net', 'pws.ir', 'mail.ir'
    ],
    
    // ===== اعتبارسنجی ایمیل =====
    isValid: function(email) {
        if (!email) return false;
        const cleaned = this.cleanEmail(email);
        return this.pattern.test(cleaned);
    },
    
    // ===== پاکسازی ایمیل =====
    cleanEmail: function(email) {
        if (!email) return '';
        return String(email).trim().toLowerCase();
    },
    
    // ===== دریافت دامنه ایمیل =====
    getDomain: function(email) {
        if (!this.isValid(email)) return null;
        const cleaned = this.cleanEmail(email);
        return cleaned.split('@')[1];
    },
    
    // ===== بررسی دامنه معتبر =====
    hasValidDomain: function(email) {
        const domain = this.getDomain(email);
        if (!domain) return false;
        return this.validDomains.includes(domain);
    },
    
    // ===== بررسی ایمیل ایرانی =====
    isIranian: function(email) {
        const domain = this.getDomain(email);
        if (!domain) return false;
        return this.iranianDomains.includes(domain);
    },
    
    // ===== بررسی جیمیل =====
    isGmail: function(email) {
        const domain = this.getDomain(email);
        return domain === 'gmail.com';
    },
    
    // ===== بررسی یاهو =====
    isYahoo: function(email) {
        const domain = this.getDomain(email);
        return domain === 'yahoo.com';
    },
    
    // ===== بررسی هاتمیل =====
    isHotmail: function(email) {
        const domain = this.getDomain(email);
        return domain === 'hotmail.com' || domain === 'outlook.com';
    },
    
    // ===== ماسک کردن ایمیل =====
    maskEmail: function(email) {
        if (!this.isValid(email)) return email;
        
        const [localPart, domain] = email.split('@');
        const maskedLocal = localPart.length > 3 
            ? localPart.slice(0, 2) + '****' + localPart.slice(-2)
            : localPart[0] + '***';
        
        return `${maskedLocal}@${domain}`;
    },
    
    // ===== تولید ایمیل تصادفی برای تست =====
    generateRandomEmail: function() {
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        const randomString = Math.random().toString(36).substring(2, 10);
        const domain = domains[Math.floor(Math.random() * domains.length)];
        return `${randomString}@${domain}`;
    },
    
    // ===== بررسی خالی بودن =====
    isEmpty: function(email) {
        return !email || this.cleanEmail(email) === '';
    },
    
    // ===== پیام خطا =====
    getErrorMessage: function(email) {
        if (this.isEmpty(email)) {
            return 'ایمیل نمی‌تواند خالی باشد';
        }
        
        if (!this.isValid(email)) {
            return 'فرمت ایمیل معتبر نیست (مثال: name@domain.com)';
        }
        
        return null;
    },
    
    // ===== نرمال‌سازی ایمیل =====
    normalize: function(email) {
        if (!email) return '';
        const cleaned = this.cleanEmail(email);
        
        // حذف نقطه‌های اضافی
        let [localPart, domain] = cleaned.split('@');
        localPart = localPart.replace(/\.+/g, '.');
        
        // حذف + و محتویات بعد از آن (برای جیمیل)
        if (domain === 'gmail.com') {
            localPart = localPart.split('+')[0];
            localPart = localPart.replace(/\./g, '');
        }
        
        return `${localPart}@${domain}`;
    }
};

window.EmailValidator = EmailValidator;
