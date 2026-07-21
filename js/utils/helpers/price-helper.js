 /* ============================================
   PRICE-HELPER.JS - توابع کمکی قیمت
   ============================================ */

const PriceHelper = {
    // ===== فرمت قیمت به تومان =====
    formatPrice: function(price, suffix = 'تومان') {
        if (price === undefined || price === null) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' ' + suffix;
    },
    
    // ===== فرمت قیمت بدون واحد =====
    formatNumber: function(number) {
        if (number === undefined || number === null) return '۰';
        return number.toLocaleString('fa-IR');
    },
    
    // ===== تبدیل قیمت به عدد =====
    parsePrice: function(priceString) {
        if (!priceString) return 0;
        const cleaned = String(priceString).replace(/[^0-9]/g, '');
        return parseInt(cleaned) || 0;
    },
    
    // ===== محاسبه تخفیف =====
    calculateDiscount: function(originalPrice, discountPercent) {
        const discountAmount = (originalPrice * discountPercent) / 100;
        const finalPrice = originalPrice - discountAmount;
        
        return {
            originalPrice: originalPrice,
            discountPercent: discountPercent,
            discountAmount: discountAmount,
            finalPrice: finalPrice,
            savedAmount: discountAmount
        };
    },
    
    // ===== محاسبه مالیات =====
    calculateTax: function(price, taxPercent = 9) {
        const taxAmount = (price * taxPercent) / 100;
        const totalWithTax = price + taxAmount;
        
        return {
            originalPrice: price,
            taxPercent: taxPercent,
            taxAmount: taxAmount,
            totalPrice: totalWithTax
        };
    },
    
    // ===== محاسبه اقساط =====
    calculateInstallments: function(totalPrice, months, interestRate = 0) {
        const interest = (totalPrice * interestRate) / 100;
        const totalWithInterest = totalPrice + interest;
        const monthlyPayment = totalWithInterest / months;
        
        return {
            totalPrice: totalPrice,
            interest: interest,
            totalWithInterest: totalWithInterest,
            months: months,
            monthlyPayment: monthlyPayment
        };
    },
    
    // ===== اعمال چند تخفیف همزمان =====
    applyMultipleDiscounts: function(price, discounts) {
        let finalPrice = price;
        const appliedDiscounts = [];
        
        for (const discount of discounts) {
            const discountAmount = (finalPrice * discount.percent) / 100;
            appliedDiscounts.push({
                name: discount.name,
                percent: discount.percent,
                amount: discountAmount
            });
            finalPrice -= discountAmount;
        }
        
        return {
            originalPrice: price,
            finalPrice: finalPrice,
            totalDiscount: price - finalPrice,
            appliedDiscounts: appliedDiscounts
        };
    },
    
    // ===== محاسبه قیمت هر واحد =====
    calculateUnitPrice: function(totalPrice, quantity) {
        if (quantity === 0) return 0;
        return totalPrice / quantity;
    },
    
    // ===== محاسبه سود =====
    calculateProfit: function(costPrice, sellingPrice) {
        const profit = sellingPrice - costPrice;
        const profitPercent = (profit / costPrice) * 100;
        
        return {
            costPrice: costPrice,
            sellingPrice: sellingPrice,
            profit: profit,
            profitPercent: profitPercent
        };
    },
    
    // ===== اعتبارسنجی مبلغ =====
    isValidPrice: function(price) {
        return !isNaN(price) && price !== null && price !== undefined && price >= 0;
    },
    
    // ===== محدود کردن قیمت در بازه =====
    clampPrice: function(price, min, max) {
        return Math.max(min, Math.min(max, price));
    },
    
    // ===== گرد کردن قیمت =====
    roundPrice: function(price, decimals = 0) {
        return Math.round(price * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },
    
    // ===== تبدیل قیمت به حروف =====
    numberToWords: function(number) {
        const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
        const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
        const tens = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
        const thousands = ['', 'هزار', 'میلیون', 'میلیارد'];
        
        if (number === 0) return 'صفر';
        
        let result = '';
        let i = 0;
        
        while (number > 0) {
            const remainder = number % 1000;
            if (remainder !== 0) {
                let groupResult = '';
                const hundreds = Math.floor(remainder / 100);
                const rest = remainder % 100;
                
                if (hundreds > 0) {
                    groupResult += units[hundreds] + 'صد';
                }
                
                if (rest >= 10 && rest < 20) {
                    groupResult += teens[rest - 10];
                } else {
                    const ten = Math.floor(rest / 10);
                    const unit = rest % 10;
                    if (ten > 0) groupResult += tens[ten];
                    if (unit > 0) groupResult += units[unit];
                }
                
                result = groupResult + (thousands[i] ? ' ' + thousands[i] : '') + ' ' + result;
            }
            number = Math.floor(number / 1000);
            i++;
        }
        
        return result.trim() + ' تومان';
    },
    
    // ===== محاسبه میانگین قیمت =====
    averagePrice: function(prices) {
        if (!prices || prices.length === 0) return 0;
        const sum = prices.reduce((a, b) => a + b, 0);
        return sum / prices.length;
    },
    
    // ===== کمترین قیمت =====
    minPrice: function(prices) {
        if (!prices || prices.length === 0) return 0;
        return Math.min(...prices);
    },
    
    // ===== بیشترین قیمت =====
    maxPrice: function(prices) {
        if (!prices || prices.length === 0) return 0;
        return Math.max(...prices);
    }
};

window.PriceHelper = PriceHelper;
