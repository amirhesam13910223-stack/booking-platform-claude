/* ============================================
   ENCRYPTION.JS - توابع رمزنگاری
   ============================================ */

   const Encryption = {
    // کلید رمزنگاری پیش‌فرض (در محیط واقعی از سرور دریافت شود)
    encryptionKey: 'BOOKING_PLATFORM_SECRET_KEY_2024',
    
    // ===== تنظیم کلید رمزنگاری =====
    setKey: function(key) {
        this.encryptionKey = key;
    },
    
    // ===== رمزنگاری ساده (Base64 + معکوس) =====
    simpleEncrypt: function(text) {
        if (!text) return '';
        // معکوس کردن رشته و سپس Base64
        const reversed = text.split('').reverse().join('');
        return btoa(unescape(encodeURIComponent(reversed)));
    },
    
    // ===== رمزگشایی ساده =====
    simpleDecrypt: function(encryptedText) {
        if (!encryptedText) return '';
        try {
            const decoded = decodeURIComponent(escape(atob(encryptedText)));
            return decoded.split('').reverse().join('');
        } catch(e) {
            console.error('خطا در رمزگشایی:', e);
            return '';
        }
    },
    
    // ===== رمزنگاری با XOR =====
    xorEncrypt: function(text, key = this.encryptionKey) {
        if (!text) return '';
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(unescape(encodeURIComponent(result)));
    },
    
    // ===== رمزگشایی با XOR =====
    xorDecrypt: function(encryptedText, key = this.encryptionKey) {
        if (!encryptedText) return '';
        try {
            const decoded = decodeURIComponent(escape(atob(encryptedText)));
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch(e) {
            console.error('خطا در رمزگشایی:', e);
            return '';
        }
    },
    
    // ===== رمزنگاری داده‌های حساس (مانند توکن) =====
    encryptSensitive: function(data) {
        if (!data) return '';
        const jsonString = JSON.stringify(data);
        return this.xorEncrypt(jsonString);
    },
    
    // ===== رمزگشایی داده‌های حساس =====
    decryptSensitive: function(encryptedData) {
        if (!encryptedData) return null;
        try {
            const decrypted = this.xorDecrypt(encryptedData);
            return JSON.parse(decrypted);
        } catch(e) {
            console.error('خطا در رمزگشایی داده حساس:', e);
            return null;
        }
    },
    
    // ===== رمزنگاری localStorage =====
    setSecureItem: function(key, value) {
        const encrypted = this.encryptSensitive(value);
        localStorage.setItem(`secure_${key}`, encrypted);
    },
    
    // ===== رمزگشایی localStorage =====
    getSecureItem: function(key) {
        const encrypted = localStorage.getItem(`secure_${key}`);
        if (!encrypted) return null;
        return this.decryptSensitive(encrypted);
    },
    
    // ===== هش کردن ساده (برای رمز عبور موقت) =====
    simpleHash: function(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    },
    
    // ===== تولید توکن تصادفی =====
    generateToken: function(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    },
    
    // ===== تولید کد یکبار مصرف (OTP) =====
    generateOTP: function(length = 6) {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += Math.floor(Math.random() * 10);
        }
        return otp;
    },
    
    // ===== تولید UUID =====
    generateUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    // ===== رمزنگاری با AES (شبیه‌سازی - در محیط واقعی از کتابخانه استفاده شود) =====
    aesEncrypt: function(text, password) {
        // این یک شبیه‌سازی است - در محیط واقعی از CryptoJS یا Web Crypto API استفاده کنید
        const combined = text + '|' + password;
        return this.simpleEncrypt(combined);
    },
    
    // ===== رمزگشایی با AES =====
    aesDecrypt: function(encryptedText, password) {
        try {
            const decrypted = this.simpleDecrypt(encryptedText);
            const [text, storedPassword] = decrypted.split('|');
            if (storedPassword !== password) return null;
            return text;
        } catch(e) {
            return null;
        }
    },
    
    // ===== رمزنگاری URL-safe =====
    urlSafeEncrypt: function(text) {
        const encrypted = this.simpleEncrypt(text);
        return encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },
    
    // ===== رمزگشایی URL-safe =====
    urlSafeDecrypt: function(encryptedText) {
        const base64 = encryptedText.replace(/-/g, '+').replace(/_/g, '/');
        return this.simpleDecrypt(base64);
    },
    
    // ===== بررسی یکپارچگی داده =====
    generateChecksum: function(data) {
        const jsonString = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < jsonString.length; i++) {
            hash = ((hash << 5) - hash) + jsonString.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString();
    },
    
    // ===== تأیید یکپارچگی داده =====
    verifyChecksum: function(data, checksum) {
        return this.generateChecksum(data) === checksum;
    }
};

window.Encryption = Encryption;