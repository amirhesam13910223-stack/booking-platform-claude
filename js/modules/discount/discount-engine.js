 /* ============================================
   DISCOUNT-ENGINE.JS - موتور اصلی تخفیف
   ============================================ */

const DiscountEngine = {
    // حداکثر تخفیف مجاز (۳۰٪)
    maxDiscountPercent: 30,
    
    // تخفیف‌های فعال
    activeDiscounts: [],
    
    // تاریخچه تخفیف‌های اعمال شده
    discountHistory: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadActiveDiscounts();
        this.attachEvents();
        console.log('🎯 موتور تخفیف راه‌اندازی شد');
    },
    
    // ===== بارگذاری تخفیف‌های فعال =====
    loadActiveDiscounts: function() {
        const saved = localStorage.getItem('active_discounts');
        if (saved) {
            try {
                this.activeDiscounts = JSON.parse(saved);
            } catch(e) {}
        }
        
        // تخفیف‌های پیش‌فرض
        if (this.activeDiscounts.length === 0) {
            this.activeDiscounts = [
                {
                    id: 'new_user',
                    name: 'تخفیف کاربر جدید',
                    type: 'percentage',
                    value: 20,
                    maxDiscount: 500000,
                    minPurchase: 100000,
                    validFor: ['first_booking'],
                    enabled: true
                },
                {
                    id: 'referral',
                    name: 'تخفیف معرفی دوست',
                    type: 'percentage',
                    value: 15,
                    maxDiscount: 300000,
                    minPurchase: 50000,
                    validFor: ['referral'],
                    enabled: true
                },
                {
                    id: 'birthday',
                    name: 'تخفیف تولد',
                    type: 'percentage',
                    value: 30,
                    maxDiscount: 500000,
                    minPurchase: 100000,
                    validFor: ['birthday_month'],
                    enabled: true
                }
            ];
            this.saveActiveDiscounts();
        }
    },
    
    // ===== ذخیره تخفیف‌های فعال =====
    saveActiveDiscounts: function() {
        localStorage.setItem('active_discounts', JSON.stringify(this.activeDiscounts));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('discount:calculate', (data) => {
            return this.calculateDiscount(data);
        });
        
        App.on('discount:apply', (data) => {
            this.applyDiscount(data);
        });
    },
    
    // ===== محاسبه تخفیف =====
    calculateDiscount: function(data) {
        const { amount, userId, bookingType, serviceId, businessId, couponCode } = data;
        
        let applicableDiscounts = [];
        let finalDiscount = 0;
        let finalAmount = amount;
        
        // 1. بررسی تخفیف کوپن
        if (couponCode && window.CouponSystem) {
            const couponDiscount = window.CouponSystem.validateCoupon(couponCode, amount);
            if (couponDiscount && couponDiscount.valid) {
                applicableDiscounts.push({
                    type: 'coupon',
                    name: couponDiscount.name,
                    value: couponDiscount.discountAmount,
                    percent: couponDiscount.percent
                });
                finalDiscount += couponDiscount.discountAmount;
            }
        }
        
        // 2. بررسی تخفیف وفاداری
        if (userId && window.LoyaltyDiscount) {
            const loyaltyDiscount = window.LoyaltyDiscount.calculateLoyaltyDiscount(userId, amount);
            if (loyaltyDiscount && loyaltyDiscount.amount > 0) {
                applicableDiscounts.push({
                    type: 'loyalty',
                    name: loyaltyDiscount.name,
                    value: loyaltyDiscount.amount,
                    percent: loyaltyDiscount.percent
                });
                finalDiscount += loyaltyDiscount.amount;
            }
        }
        
        // 3. بررسی تخفیف معرفی
        if (userId && window.ReferralDiscount) {
            const referralDiscount = window.ReferralDiscount.getReferralDiscount(userId, amount);
            if (referralDiscount && referralDiscount.amount > 0) {
                applicableDiscounts.push({
                    type: 'referral',
                    name: referralDiscount.name,
                    value: referralDiscount.amount,
                    percent: referralDiscount.percent
                });
                finalDiscount += referralDiscount.amount;
            }
        }
        
        // 4. بررسی تخفیف گروهی
        if (data.groupSize && data.groupSize >= 2 && window.GroupDiscount) {
            const groupDiscount = window.GroupDiscount.calculateGroupDiscount(data.groupSize, amount);
            if (groupDiscount && groupDiscount.amount > 0) {
                applicableDiscounts.push({
                    type: 'group',
                    name: groupDiscount.name,
                    value: groupDiscount.amount,
                    percent: groupDiscount.percent
                });
                finalDiscount += groupDiscount.amount;
            }
        }
        
        // 5. بررسی تخفیف فصلی
        if (window.SeasonalDiscount) {
            const seasonalDiscount = window.SeasonalDiscount.getCurrentSeasonalDiscount(amount, serviceId, businessId);
            if (seasonalDiscount && seasonalDiscount.amount > 0) {
                applicableDiscounts.push({
                    type: 'seasonal',
                    name: seasonalDiscount.name,
                    value: seasonalDiscount.amount,
                    percent: seasonalDiscount.percent
                });
                finalDiscount += seasonalDiscount.amount;
            }
        }
        
        // محدودیت حداکثر تخفیف (۳۰٪ از مبلغ اصلی)
        const maxAllowedDiscount = (amount * this.maxDiscountPercent) / 100;
        if (finalDiscount > maxAllowedDiscount) {
            finalDiscount = maxAllowedDiscount;
        }
        
        finalAmount = amount - finalDiscount;
        
        const result = {
            originalAmount: amount,
            discountAmount: finalDiscount,
            finalAmount: finalAmount,
            discountPercent: (finalDiscount / amount) * 100,
            appliedDiscounts: applicableDiscounts,
            maxDiscountReached: finalDiscount >= maxAllowedDiscount
        };
        
        return result;
    },
    
    // ===== اعمال تخفیف =====
    applyDiscount: function(data) {
        const { bookingId, discountResult, userId } = data;
        
        const discountRecord = {
            id: 'DSC' + Date.now() + Math.floor(Math.random() * 10000),
            bookingId: bookingId,
            userId: userId,
            originalAmount: discountResult.originalAmount,
            discountAmount: discountResult.discountAmount,
            finalAmount: discountResult.finalAmount,
            discountPercent: discountResult.discountPercent,
            appliedDiscounts: discountResult.appliedDiscounts,
            appliedAt: new Date().toISOString()
        };
        
        this.discountHistory.unshift(discountRecord);
        this.saveDiscountHistory();
        
        App.emit('discount:applied', discountRecord);
        
        return discountRecord;
    },
    
    // ===== ذخیره تاریخچه تخفیف‌ها =====
    saveDiscountHistory: function() {
        localStorage.setItem('discount_history', JSON.stringify(this.discountHistory.slice(0, 100)));
    },
    
    // ===== دریافت تاریخچه تخفیف‌های کاربر =====
    getUserDiscountHistory: function(userId) {
        return this.discountHistory.filter(d => d.userId === userId);
    },
    
    // ===== دریافت مجموع تخفیف‌های کاربر =====
    getUserTotalDiscount: function(userId) {
        const userDiscounts = this.getUserDiscountHistory(userId);
        return userDiscounts.reduce((sum, d) => sum + d.discountAmount, 0);
    },
    
    // ===== افزودن تخفیف جدید =====
    addDiscount: function(discount) {
        const newDiscount = {
            id: 'DSC' + Date.now() + Math.random().toString(36).substr(2, 8),
            createdAt: new Date().toISOString(),
            enabled: true,
            ...discount
        };
        
        this.activeDiscounts.push(newDiscount);
        this.saveActiveDiscounts();
        
        App.emit('discount:added', newDiscount);
        return newDiscount;
    },
    
    // ===== غیرفعال کردن تخفیف =====
    disableDiscount: function(discountId) {
        const index = this.activeDiscounts.findIndex(d => d.id === discountId);
        if (index !== -1) {
            this.activeDiscounts[index].enabled = false;
            this.saveActiveDiscounts();
            App.emit('discount:disabled', discountId);
            return true;
        }
        return false;
    },
    
    // ===== فعال کردن تخفیف =====
    enableDiscount: function(discountId) {
        const index = this.activeDiscounts.findIndex(d => d.id === discountId);
        if (index !== -1) {
            this.activeDiscounts[index].enabled = true;
            this.saveActiveDiscounts();
            App.emit('discount:enabled', discountId);
            return true;
        }
        return false;
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    },
    
    // ===== نمایش مودال نتیجه تخفیف =====
    showDiscountResultModal: function(discountResult) {
        const modal = document.createElement('div');
        modal.id = 'discountResultModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-sm">
                <div class="modal-header">
                    <h3>🎉 تخفیف اعمال شد!</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="discount-summary">
                        <div class="summary-row">
                            <span>مبلغ اصلی:</span>
                            <span>${this.formatPrice(discountResult.originalAmount)}</span>
                        </div>
                        <div class="summary-row discount">
                            <span>تخفیف:</span>
                            <span class="discount-amount">- ${this.formatPrice(discountResult.discountAmount)}</span>
                        </div>
                        ${discountResult.appliedDiscounts.map(d => `
                            <div class="summary-row small">
                                <span>${d.name}:</span>
                                <span>${d.percent}% (${this.formatPrice(d.value)})</span>
                            </div>
                        `).join('')}
                        <div class="summary-row total">
                            <span>مبلغ قابل پرداخت:</span>
                            <span class="total-amount">${this.formatPrice(discountResult.finalAmount)}</span>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">متوجه شدم</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }
};

// استایل‌های مودال تخفیف
const discountStyles = `
<style>
.discount-summary {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin: 10px 0;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
}

.summary-row:last-child {
    border-bottom: none;
}

.summary-row.discount {
    color: var(--color-success);
}

.summary-row.total {
    font-weight: bold;
    font-size: 16px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 2px solid var(--border-color);
}

.discount-amount {
    color: var(--color-success);
}

.total-amount {
    color: var(--color-primary);
    font-size: 18px;
}

.summary-row.small {
    font-size: 12px;
    color: var(--text-tertiary);
    padding: 4px 0;
}
</style>
`;

if (!document.querySelector('#discount-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'discount-styles';
    styleSheet.textContent = discountStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    DiscountEngine.init();
});

window.DiscountEngine = DiscountEngine;
