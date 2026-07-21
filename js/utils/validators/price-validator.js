/* ============================================
   PRICE-VALIDATOR.JS - اعتبارسنجی قیمت
   ============================================ */

   const PriceValidator = {
    // ===== اعتبارسنجی قیمت =====
    isValid: function(price) {
        if (price === undefined || price === null) return false;
        const num = Number(price);
        return !isNaN(num) && num >= 0 && isFinite(num);
    },
    
    // ===== اعتبارسنجی قیمت مثبت =====
    isPositive: function(price) {
        return this.isValid(price) && price > 0;
    },
    
    // ===== اعتبارسنجی قیمت صحیح =====
    isInteger: function(price) {
        return this.isValid(price) && Number.isInteger(price);
    },
    
    // ===== اعتبارسنجی محدوده قیمت =====
    isInRange: function(price, min, max) {
        if (!this.isValid(price)) return false;
        return price >= min && price <= max;
    },
    
    // ===== اعتبارسنجی حداقل قیمت =====
    isMin: function(price, min) {
        return this.isValid(price) && price >= min;
    },
    
    // ===== اعتبارسنجی حداکثر قیمت =====
    isMax: function(price, max) {
        return this.isValid(price) && price <= max;
    },
    
    // ===== نرمال‌سازی قیمت =====
    normalize: function(price) {
        if (!this.isValid(price)) return 0;
        return Math.round(Number(price));
    },
    
    // ===== بررسی خالی بودن =====
    isEmpty: function(price) {
        return price === undefined || price === null || price === '';
    },
    
    // ===== اعتبارسنجی درصد =====
    isValidPercent: function(percent) {
        if (!this.isValid(percent)) return false;
        return percent >= 0 && percent <= 100;
    },
    
    // ===== اعتبارسنجی تخفیف =====
    isValidDiscount: function(originalPrice, discountedPrice) {
        if (!this.isPositive(originalPrice)) return false;
        if (!this.isValid(discountedPrice)) return false;
        return discountedPrice <= originalPrice && discountedPrice >= 0;
    },
    
    // ===== محاسبه حداکثر تخفیف مجاز =====
    getMaxDiscount: function(originalPrice, maxPercent = 30) {
        if (!this.isPositive(originalPrice)) return 0;
        return (originalPrice * maxPercent) / 100;
    },
    
    // ===== اعتبارسنجی نرخ کارمزد =====
    isValidCommission: function(rate) {
        if (!this.isValid(rate)) return false;
        return rate >= 0 && rate <= 10;
    },
    
    // ===== پیام خطا =====
    getErrorMessage: function(price) {
        if (this.isEmpty(price)) {
            return 'قیمت نمی‌تواند خالی باشد';
        }
        
        if (!this.isValid(price)) {
            return 'قیمت معتبر نیست';
        }
        
        if (!this.isPositive(price)) {
            return 'قیمت باید بزرگتر از صفر باشد';
        }
        
        return null;
    }
};

window.PriceValidator = PriceValidator; 
