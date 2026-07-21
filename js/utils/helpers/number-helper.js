 /* ============================================
   NUMBER-HELPER.JS - توابع کمکی عدد
   ============================================ */

const NumberHelper = {
    // ===== اعتبارسنجی عدد =====
    isNumber: function(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },
    
    // ===== تبدیل به عدد =====
    toNumber: function(value, defaultValue = 0) {
        const num = parseFloat(value);
        return this.isNumber(num) ? num : defaultValue;
    },
    
    // ===== تبدیل به عدد صحیح =====
    toInt: function(value, defaultValue = 0) {
        const num = parseInt(value);
        return this.isNumber(num) ? num : defaultValue;
    },
    
    // ===== گرد کردن =====
    round: function(value, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    },
    
    // ===== گرد کردن به بالا =====
    ceil: function(value, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.ceil(value * factor) / factor;
    },
    
    // ===== گرد کردن به پایین =====
    floor: function(value, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.floor(value * factor) / factor;
    },
    
    // ===== محدود کردن در بازه =====
    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    // ===== درصد =====
    percent: function(value, total) {
        if (total === 0) return 0;
        return (value / total) * 100;
    },
    
    // ===== محاسبه درصد از مقدار =====
    percentOf: function(percent, total) {
        return (percent / 100) * total;
    },
    
    // ===== فاصله بین دو عدد =====
    distance: function(a, b) {
        return Math.abs(a - b);
    },
    
    // ===== عدد تصادفی =====
    random: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // ===== عدد تصادفی اعشاری =====
    randomFloat: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // ===== جمع اعداد =====
    sum: function(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0);
    },
    
    // ===== میانگین =====
    average: function(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        return this.sum(numbers) / numbers.length;
    },
    
    // ===== میانه =====
    median: function(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    },
    
    // ===== مد =====
    mode: function(numbers) {
        if (!numbers || numbers.length === 0) return null;
        const freq = {};
        let maxFreq = 0;
        let mode = null;
        
        for (const num of numbers) {
            freq[num] = (freq[num] || 0) + 1;
            if (freq[num] > maxFreq) {
                maxFreq = freq[num];
                mode = num;
            }
        }
        
        return mode;
    },
    
    // ===== واریانس =====
    variance: function(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        const avg = this.average(numbers);
        const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2));
        return this.average(squaredDiffs);
    },
    
    // ===== انحراف معیار =====
    stdDev: function(numbers) {
        return Math.sqrt(this.variance(numbers));
    },
    
    // ===== فاکتوریل =====
    factorial: function(n) {
        if (n < 0) return null;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    },
    
    // ===== فیبوناچی =====
    fibonacci: function(n) {
        if (n <= 0) return 0;
        if (n === 1) return 1;
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    },
    
    // ===== تبدیل به عدد رومی =====
    toRoman: function(num) {
        const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
        
        let result = '';
        for (let i = 0; i < values.length; i++) {
            while (num >= values[i]) {
                result += symbols[i];
                num -= values[i];
            }
        }
        return result;
    },
    
    // ===== تبدیل از عدد رومی =====
    fromRoman: function(roman) {
        const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
        let total = 0;
        let prev = 0;
        
        for (let i = roman.length - 1; i >= 0; i--) {
            const current = map[roman[i]];
            if (current < prev) {
                total -= current;
            } else {
                total += current;
            }
            prev = current;
        }
        return total;
    },
    
    // ===== تبدیل به باینری =====
    toBinary: function(num) {
        return num.toString(2);
    },
    
    // ===== تبدیل از باینری =====
    fromBinary: function(binary) {
        return parseInt(binary, 2);
    },
    
    // ===== تبدیل به هگز =====
    toHex: function(num) {
        return num.toString(16).toUpperCase();
    },
    
    // ===== تبدیل از هگز =====
    fromHex: function(hex) {
        return parseInt(hex, 16);
    },
    
    // ===== اعتبارسنجی شماره کارت =====
    isValidCardNumber: function(cardNumber) {
        const num = String(cardNumber).replace(/\s/g, '');
        if (!/^\d{16}$/.test(num)) return false;
        
        let sum = 0;
        let isEven = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let digit = parseInt(num[i]);
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            isEven = !isEven;
        }
        return sum % 10 === 0;
    },
    
    // ===== اعتبارسنجی شبا =====
    isValidIBAN: function(iban) {
        const cleaned = String(iban).toUpperCase().replace(/\s/g, '');
        const regex = /^IR\d{24}$/;
        return regex.test(cleaned);
    },
    
    // ===== تبدیل به حروف ===== (با استفاده از PriceHelper)
    toWords: function(number) {
        if (window.PriceHelper) {
            return window.PriceHelper.numberToWords(number);
        }
        return number.toString();
    }
};

window.NumberHelper = NumberHelper;
