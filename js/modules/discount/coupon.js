 /* ============================================
   COUPON.JS - مدیریت کدهای تخفیف
   ============================================ */

const CouponSystem = {
    // کوپن‌های فعال
    coupons: [],
    
    // کوپن‌های استفاده شده
    usedCoupons: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadCoupons();
        this.attachEvents();
        console.log('🏷️ سیستم کوپن راه‌اندازی شد');
    },
    
    // ===== بارگذاری کوپن‌ها =====
    loadCoupons: function() {
        const saved = localStorage.getItem('coupons');
        if (saved) {
            try {
                this.coupons = JSON.parse(saved);
            } catch(e) {}
        }
        
        // کوپن‌های پیش‌فرض
        if (this.coupons.length === 0) {
            this.coupons = [
                {
                    id: 'WELCOME10',
                    code: 'WELCOME10',
                    name: 'تخفیف خوش‌آمدگویی',
                    type: 'percentage',
                    value: 10,
                    maxDiscount: 200000,
                    minPurchase: 50000,
                    validFrom: new Date().toISOString(),
                    validTo: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                    usageLimit: 1,
                    usageCount: 0,
                    enabled: true
                },
                {
                    id: 'SUMMER20',
                    code: 'SUMMER20',
                    name: 'تخفیف تابستانه',
                    type: 'percentage',
                    value: 20,
                    maxDiscount: 500000,
                    minPurchase: 200000,
                    validFrom: new Date().toISOString(),
                    validTo: new Date(Date.now() + 60*24*60*60*1000).toISOString(),
                    usageLimit: 100,
                    usageCount: 0,
                    enabled: true
                },
                {
                    id: 'FIRST50',
                    code: 'FIRST50',
                    name: 'تخفیف ویژه اولین خرید',
                    type: 'fixed',
                    value: 50000,
                    minPurchase: 100000,
                    validFrom: new Date().toISOString(),
                    validTo: new Date(Date.now() + 90*24*60*60*1000).toISOString(),
                    usageLimit: 1,
                    usageCount: 0,
                    enabled: true,
                    onlyFirstBooking: true
                }
            ];
            this.saveCoupons();
        }
        
        this.loadUsedCoupons();
    },
    
    // ===== بارگذاری کوپن‌های استفاده شده =====
    loadUsedCoupons: function() {
        const saved = localStorage.getItem('used_coupons');
        if (saved) {
            try {
                this.usedCoupons = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره کوپن‌ها =====
    saveCoupons: function() {
        localStorage.setItem('coupons', JSON.stringify(this.coupons));
    },
    
    // ===== ذخیره کوپن‌های استفاده شده =====
    saveUsedCoupons: function() {
        localStorage.setItem('used_coupons', JSON.stringify(this.usedCoupons));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('coupon:validate', (data) => {
            return this.validateCoupon(data.code, data.amount, data.userId);
        });
        
        App.on('coupon:apply', (data) => {
            this.applyCoupon(data);
        });
    },
    
    // ===== اعتبارسنجی کوپن =====
    validateCoupon: function(code, amount, userId = null) {
        const coupon = this.coupons.find(c => c.code === code && c.enabled);
        
        if (!coupon) {
            return { valid: false, message: 'کد تخفیف نامعتبر است' };
        }
        
        // بررسی تاریخ
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validTo = new Date(coupon.validTo);
        
        if (now < validFrom) {
            return { valid: false, message: 'این کد تخفیف هنوز فعال نشده است' };
        }
        
        if (now > validTo) {
            return { valid: false, message: 'این کد تخفیف منقضی شده است' };
        }
        
        // بررسی محدودیت استفاده
        if (coupon.usageCount >= coupon.usageLimit) {
            return { valid: false, message: 'این کد تخفیف به حداکثر استفاده رسیده است' };
        }
        
        // بررسی حداقل مبلغ خرید
        if (amount < coupon.minPurchase) {
            return { valid: false, message: `حداقل مبلغ خرید برای این کد تخفیف ${this.formatPrice(coupon.minPurchase)} می‌باشد` };
        }
        
        // بررسی استفاده قبلی توسط کاربر
        if (userId) {
            const userUsed = this.usedCoupons.some(uc => uc.userId === userId && uc.couponId === coupon.id);
            if (userUsed) {
                return { valid: false, message: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید' };
            }
        }
        
        // محاسبه مبلغ تخفیف
        let discountAmount = 0;
        let discountPercent = 0;
        
        if (coupon.type === 'percentage') {
            discountAmount = (amount * coupon.value) / 100;
            discountPercent = coupon.value;
            if (discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.value;
            discountPercent = (discountAmount / amount) * 100;
        }
        
        return {
            valid: true,
            coupon: coupon,
            discountAmount: discountAmount,
            discountPercent: discountPercent,
            message: 'کد تخفیف معتبر است'
        };
    },
    
    // ===== اعمال کوپن =====
    applyCoupon: function(data) {
        const { code, amount, userId, bookingId } = data;
        const validation = this.validateCoupon(code, amount, userId);
        
        if (!validation.valid) {
            App.showToast(validation.message, 'error');
            return false;
        }
        
        // ثبت استفاده
        validation.coupon.usageCount++;
        this.saveCoupons();
        
        // ثبت در تاریخچه استفاده کاربر
        this.usedCoupons.push({
            userId: userId,
            couponId: validation.coupon.id,
            couponCode: code,
            bookingId: bookingId,
            discountAmount: validation.discountAmount,
            usedAt: new Date().toISOString()
        });
        this.saveUsedCoupons();
        
        App.showToast(`کد تخفیف ${code} با موفقیت اعمال شد. ${this.formatPrice(validation.discountAmount)} تخفیف گرفتید!`, 'success');
        
        App.emit('coupon:applied', {
            coupon: validation.coupon,
            discountAmount: validation.discountAmount,
            bookingId: bookingId
        });
        
        return validation;
    },
    
    // ===== ایجاد کوپن جدید =====
    createCoupon: function(data) {
        const newCoupon = {
            id: 'CPN' + Date.now() + Math.random().toString(36).substr(2, 8),
            code: data.code.toUpperCase(),
            name: data.name,
            type: data.type,
            value: data.value,
            maxDiscount: data.maxDiscount || null,
            minPurchase: data.minPurchase || 0,
            validFrom: data.validFrom || new Date().toISOString(),
            validTo: data.validTo,
            usageLimit: data.usageLimit || 1,
            usageCount: 0,
            enabled: true,
            createdAt: new Date().toISOString()
        };
        
        this.coupons.push(newCoupon);
        this.saveCoupons();
        
        App.showToast(`کوپن ${newCoupon.code} با موفقیت ایجاد شد`, 'success');
        return newCoupon;
    },
    
    // ===== حذف کوپن =====
    deleteCoupon: function(couponId) {
        const index = this.coupons.findIndex(c => c.id === couponId);
        if (index !== -1) {
            this.coupons.splice(index, 1);
            this.saveCoupons();
            App.showToast('کوپن با موفقیت حذف شد', 'success');
            return true;
        }
        return false;
    },
    
    // ===== دریافت کوپن‌های فعال =====
    getActiveCoupons: function() {
        const now = new Date();
        return this.coupons.filter(c => 
            c.enabled && 
            new Date(c.validFrom) <= now && 
            new Date(c.validTo) >= now &&
            c.usageCount < c.usageLimit
        );
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    },
    
    // ===== نمایش مودال اعمال کوپن =====
    showCouponModal: function(amount, callback) {
        const modal = document.createElement('div');
        modal.id = 'couponModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🏷️ اعمال کد تخفیف</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>کد تخفیف</label>
                        <input type="text" id="couponCode" class="form-control" placeholder="مثال: WELCOME10">
                    </div>
                    <div id="couponValidationResult"></div>
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                        <button class="btn btn-primary" id="applyCouponBtn">اعمال کد تخفیف</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('applyCouponBtn')?.addEventListener('click', () => {
            const code = document.getElementById('couponCode')?.value.trim().toUpperCase();
            if (code) {
                const validation = this.validateCoupon(code, amount);
                const resultDiv = document.getElementById('couponValidationResult');
                
                if (validation.valid) {
                    resultDiv.innerHTML = `<div class="validation-success">✅ ${validation.message} - تخفیف: ${this.formatPrice(validation.discountAmount)}</div>`;
                    if (callback) callback(validation);
                    setTimeout(() => modal.remove(), 1500);
                } else {
                    resultDiv.innerHTML = `<div class="validation-error">❌ ${validation.message}</div>`;
                }
            } else {
                App.showToast('لطفاً کد تخفیف را وارد کنید', 'warning');
            }
        });
    }
};

// استایل‌های اعتبارسنجی کوپن
const couponStyles = `
<style>
.validation-success {
    background: var(--color-success-soft);
    color: var(--color-success);
    padding: 10px;
    border-radius: var(--radius-md);
    margin: 10px 0;
    text-align: center;
}

.validation-error {
    background: var(--color-danger-soft);
    color: var(--color-danger);
    padding: 10px;
    border-radius: var(--radius-md);
    margin: 10px 0;
    text-align: center;
}
</style>
`;

if (!document.querySelector('#coupon-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'coupon-styles';
    styleSheet.textContent = couponStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    CouponSystem.init();
});

window.CouponSystem = CouponSystem;
