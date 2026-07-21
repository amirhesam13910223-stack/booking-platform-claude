 /* ============================================
   NATIONAL-CODE.JS - اعتبارسنجی کد ملی
   ============================================ */

const NationalCodeValidator = {
    // ===== اعتبارسنجی کد ملی =====
    isValid: function(code) {
        if (!code) return false;
        
        // حذف فاصله و کاراکترهای غیرعددی
        const nationalCode = String(code).replace(/\s/g, '');
        
        // بررسی طول
        if (nationalCode.length !== 10) return false;
        
        // بررسی عدم تکراری بودن همه ارقام
        if (/^(\d)\1{9}$/.test(nationalCode)) return false;
        
        // محاسبه کنترل دیجیت
        const check = parseInt(nationalCode[9]);
        let sum = 0;
        
        for (let i = 0; i < 9; i++) {
            sum += parseInt(nationalCode[i]) * (10 - i);
        }
        
        const remainder = sum % 11;
        
        if (remainder < 2) {
            return check === remainder;
        } else {
            return check === 11 - remainder;
        }
    },
    
    // ===== پاکسازی کد ملی =====
    clean: function(code) {
        if (!code) return '';
        return String(code).replace(/[^0-9]/g, '');
    },
    
    // ===== فرمت کد ملی =====
    format: function(code) {
        const cleaned = this.clean(code);
        if (cleaned.length !== 10) return code;
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    },
    
    // ===== استخراج استان =====
    getProvinceCode: function(code) {
        if (!this.isValid(code)) return null;
        const cleaned = this.clean(code);
        return parseInt(cleaned.slice(0, 2));
    },
    
    // ===== استخراج جنسیت =====
    getGender: function(code) {
        if (!this.isValid(code)) return null;
        const cleaned = this.clean(code);
        const genderDigit = parseInt(cleaned[8]);
        return genderDigit % 2 === 0 ? 'زن' : 'مرد';
    },
    
    // ===== بررسی خالی بودن =====
    isEmpty: function(code) {
        return !code || this.clean(code) === '';
    },
    
    // ===== تولید کد ملی تصادفی معتبر =====
    generateRandom: function() {
        let code = '';
        for (let i = 0; i < 9; i++) {
            code += Math.floor(Math.random() * 10);
        }
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(code[i]) * (10 - i);
        }
        
        const remainder = sum % 11;
        let check;
        
        if (remainder < 2) {
            check = remainder;
        } else {
            check = 11 - remainder;
        }
        
        return code + check;
    },
    
    // ===== پیام خطا =====
    getErrorMessage: function(code) {
        if (this.isEmpty(code)) {
            return 'کد ملی نمی‌تواند خالی باشد';
        }
        
        const cleaned = this.clean(code);
        if (cleaned.length !== 10) {
            return 'کد ملی باید ۱۰ رقم باشد';
        }
        
        if (!this.isValid(code)) {
            return 'کد ملی معتبر نیست';
        }
        
        return null;
    }
};

window.NationalCodeValidator = NationalCodeValidator;
