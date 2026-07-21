/* ============================================
   PHONE-VALIDATOR.JS - اعتبارسنجی شماره تماس
   ============================================ */

   const PhoneValidator = {
    // الگوهای شماره تماس ایران
    patterns: {
        mobile: /^09[0-9]{9}$/,
        landline: /^0[1-8][0-9]{1,9}$/,
        all: /^(09[0-9]{9}|0[1-8][0-9]{1,9})$/
    },
    
    // اپراتورهای تلفن همراه
    operators: {
        '0910': 'همراه اول',
        '0911': 'همراه اول',
        '0912': 'همراه اول',
        '0913': 'همراه اول',
        '0914': 'همراه اول',
        '0915': 'همراه اول',
        '0916': 'همراه اول',
        '0917': 'همراه اول',
        '0918': 'همراه اول',
        '0919': 'همراه اول',
        '0900': 'ایرانسل',
        '0901': 'ایرانسل',
        '0902': 'ایرانسل',
        '0903': 'ایرانسل',
        '0904': 'ایرانسل',
        '0905': 'ایرانسل',
        '0930': 'ایرانسل',
        '0933': 'ایرانسل',
        '0935': 'ایرانسل',
        '0936': 'ایرانسل',
        '0937': 'ایرانسل',
        '0938': 'ایرانسل',
        '0939': 'ایرانسل',
        '0920': 'رایتل',
        '0921': 'رایتل',
        '0922': 'رایتل',
        '0990': 'آپتا',
        '0991': 'آپتا',
        '0992': 'آپتا',
        '0993': 'آپتا',
        '0994': 'آپتا'
    },
    
    // ===== اعتبارسنجی شماره موبایل =====
    isValidMobile: function(phone) {
        if (!phone) return false;
        const cleaned = this.cleanPhoneNumber(phone);
        return this.patterns.mobile.test(cleaned);
    },
    
    // ===== اعتبارسنجی شماره ثابت =====
    isValidLandline: function(phone) {
        if (!phone) return false;
        const cleaned = this.cleanPhoneNumber(phone);
        return this.patterns.landline.test(cleaned);
    },
    
    // ===== اعتبارسنجی هر شماره تماس =====
    isValid: function(phone) {
        if (!phone) return false;
        const cleaned = this.cleanPhoneNumber(phone);
        return this.patterns.all.test(cleaned);
    },
    
    // ===== پاکسازی شماره تماس =====
    cleanPhoneNumber: function(phone) {
        if (!phone) return '';
        return String(phone).replace(/[^0-9]/g, '');
    },
    
    // ===== فرمت کردن شماره تماس =====
    formatPhoneNumber: function(phone) {
        const cleaned = this.cleanPhoneNumber(phone);
        if (!cleaned) return '';
        
        if (cleaned.length === 11 && cleaned.startsWith('09')) {
            return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
        }
        
        if (cleaned.length === 10 && cleaned.startsWith('0')) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
        }
        
        return phone;
    },
    
    // ===== دریافت اپراتور =====
    getOperator: function(phone) {
        const cleaned = this.cleanPhoneNumber(phone);
        if (!this.isValidMobile(cleaned)) return null;
        
        const prefix = cleaned.slice(0, 4);
        return this.operators[prefix] || 'سایر';
    },
    
    // ===== بررسی همراه اول =====
    isHamrahAvval: function(phone) {
        const cleaned = this.cleanPhoneNumber(phone);
        if (!this.isValidMobile(cleaned)) return false;
        const prefix = cleaned.slice(0, 4);
        return prefix.startsWith('091') && !['093', '099'].includes(prefix.slice(2, 3));
    },
    
    // ===== بررسی ایرانسل =====
    isIrancel: function(phone) {
        const cleaned = this.cleanPhoneNumber(phone);
        if (!this.isValidMobile(cleaned)) return false;
        const prefix = cleaned.slice(0, 4);
        return ['0930', '0933', '0935', '0936', '0937', '0938', '0939', '0900', '0901', '0902', '0903', '0904', '0905'].includes(prefix);
    },
    
    // ===== بررسی رایتل =====
    isRightel: function(phone) {
        const cleaned = this.cleanPhoneNumber(phone);
        if (!this.isValidMobile(cleaned)) return false;
        const prefix = cleaned.slice(0, 4);
        return ['0920', '0921', '0922'].includes(prefix);
    },
    
    // ===== بررسی آپتا =====
    isApeta: function(phone) {
        const cleaned = this.cleanPhoneNumber(phone);
        if (!this.isValidMobile(cleaned)) return false;
        const prefix = cleaned.slice(0, 4);
        return ['0990', '0991', '0992', '0993', '0994'].includes(prefix);
    },
    
    // ===== تولید شماره تصادفی برای تست =====
    generateRandomPhone: function() {
        const prefixes = ['0910', '0911', '0912', '0913', '0914', '0915', '0916', '0917', '0918', '0919', '0930', '0933', '0935', '0936', '0937', '0938', '0939'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        return prefix + suffix;
    },
    
    // ===== نرمال‌سازی شماره =====
    normalize: function(phone) {
        const cleaned = this.cleanPhoneNumber(phone);
        if (!cleaned) return '';
        
        if (cleaned.length === 11 && cleaned.startsWith('09')) {
            return cleaned;
        }
        
        if (cleaned.length === 10 && cleaned.startsWith('0')) {
            return `0${cleaned.slice(1)}`;
        }
        
        if (cleaned.length === 10 && !cleaned.startsWith('0')) {
            return `0${cleaned}`;
        }
        
        return cleaned;
    },
    
    // ===== بررسی خالی بودن =====
    isEmpty: function(phone) {
        return !phone || this.cleanPhoneNumber(phone) === '';
    },
    
    // ===== پیام خطا =====
    getErrorMessage: function(phone) {
        if (this.isEmpty(phone)) {
            return 'شماره تماس نمی‌تواند خالی باشد';
        }
        
        if (!this.isValid(phone)) {
            return 'شماره تماس معتبر نیست';
        }
        
        if (!this.isValidMobile(phone)) {
            return 'شماره تماس باید با 09 شروع شود';
        }
        
        return null;
    }
};

window.PhoneValidator = PhoneValidator; 
