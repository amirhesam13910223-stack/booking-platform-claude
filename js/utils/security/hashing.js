 /* ============================================
   HASHING.JS - توابع هش کردن
   ============================================ */

const Hashing = {
    // ===== هش ساده SHA-256 مانند (شبیه‌سازی) =====
    simpleHash: function(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    },
    
    // ===== هش پیشرفته‌تر =====
    advancedHash: function(text, salt = '') {
        const combined = text + salt + 'BOOKING_PLATFORM_SALT';
        let hash = 5381;
        for (let i = 0; i < combined.length; i++) {
            hash = ((hash << 5) + hash) + combined.charCodeAt(i);
        }
        return Math.abs(hash).toString(16);
    },
    
    // ===== تولید salt =====
    generateSalt: function(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let salt = '';
        for (let i = 0; i < length; i++) {
            salt += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return salt;
    },
    
    // ===== هش رمز عبور =====
    hashPassword: function(password) {
        const salt = this.generateSalt();
        const hash = this.advancedHash(password, salt);
        return {
            salt: salt,
            hash: hash
        };
    },
    
    // ===== تأیید رمز عبور =====
    verifyPassword: function(password, salt, storedHash) {
        const hash = this.advancedHash(password, salt);
        return hash === storedHash;
    },
    
    // ===== هش با استفاده از Web Crypto API (در صورت وجود) =====
    cryptoHash: async function(text, algorithm = 'SHA-256') {
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hashBuffer = await window.crypto.subtle.digest(algorithm, data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            return this.advancedHash(text);
        }
    },
    
    // ===== هش با salt پویا =====
    dynamicHash: async function(text) {
        const timestamp = Date.now();
        const salt = timestamp.toString();
        if (window.crypto && window.crypto.subtle) {
            return await this.cryptoHash(text + salt);
        }
        return this.advancedHash(text + salt);
    },
    
    // ===== محاسبه HMAC =====
    hmac: function(text, key) {
        // شبیه‌سازی HMAC ساده
        return this.advancedHash(text + key);
    },
    
    // ===== هش فایل (برای آپلود) =====
    hashFile: async function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;
                if (window.crypto && window.crypto.subtle) {
                    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    resolve(hashHex);
                } else {
                    // fallback ساده
                    const text = await file.text();
                    resolve(this.advancedHash(text));
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },
    
    // ===== هش شیء =====
    hashObject: function(obj) {
        const jsonString = JSON.stringify(obj);
        return this.advancedHash(jsonString);
    },
    
    // ===== هش با زمان =====
    timedHash: function(text, expirationSeconds = 3600) {
        const timestamp = Math.floor(Date.now() / 1000 / expirationSeconds);
        return this.advancedHash(text + timestamp);
    },
    
    // ===== تأیید هش زماندار =====
    verifyTimedHash: function(text, hash, expirationSeconds = 3600) {
        const currentTimestamp = Math.floor(Date.now() / 1000 / expirationSeconds);
        const currentHash = this.advancedHash(text + currentTimestamp);
        const previousHash = this.advancedHash(text + (currentTimestamp - 1));
        return hash === currentHash || hash === previousHash;
    },
    
    // ===== هش کوتاه (برای کدهای تخفیف) =====
    shortHash: function(text, length = 8) {
        const fullHash = this.advancedHash(text);
        return fullHash.substring(0, length);
    },
    
    // ===== هش عددی (برای OTP) =====
    numericHash: function(text, length = 6) {
        const hash = this.advancedHash(text);
        let numeric = '';
        for (let i = 0; i < hash.length && numeric.length < length; i++) {
            const code = hash.charCodeAt(i);
            if (code >= 48 && code <= 57) {
                numeric += String.fromCharCode(code);
            }
        }
        while (numeric.length < length) {
            numeric += Math.floor(Math.random() * 10);
        }
        return numeric;
    }
};

window.Hashing = Hashing;
