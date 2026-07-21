 /* ============================================
   SEASONAL.JS - تخفیف فصلی و مناسبت‌ها (کامل)
   ============================================ */

const SeasonalDiscount = {
    // تخفیف‌های فصلی
    seasonalDiscounts: [
        {
            id: 'new_year',
            name: 'تخفیف نوروزی',
            percent: 25,
            startMonth: 3,
            startDay: 1,
            endMonth: 3,
            endDay: 15,
            maxDiscount: 1000000,
            minPurchase: 200000,
            enabled: true
        },
        {
            id: 'summer',
            name: 'تخفیف تابستانه',
            percent: 20,
            startMonth: 6,
            startDay: 1,
            endMonth: 8,
            endDay: 31,
            maxDiscount: 500000,
            minPurchase: 150000,
            enabled: true
        },
        {
            id: 'autumn',
            name: 'تخفیف پاییزه',
            percent: 15,
            startMonth: 9,
            startDay: 1,
            endMonth: 10,
            endDay: 30,
            maxDiscount: 400000,
            minPurchase: 120000,
            enabled: true
        },
        {
            id: 'winter',
            name: 'تخفیف زمستانه',
            percent: 18,
            startMonth: 12,
            startDay: 1,
            endMonth: 1,
            endDay: 30,
            maxDiscount: 450000,
            minPurchase: 130000,
            enabled: true
        },
        {
            id: 'black_friday',
            name: 'جمعه سیاه',
            percent: 30,
            startMonth: 11,
            startDay: 25,
            endMonth: 11,
            endDay: 30,
            maxDiscount: 1500000,
            minPurchase: 300000,
            enabled: true
        },
        {
            id: 'valentine',
            name: 'تخفیف روز عشق',
            percent: 15,
            startMonth: 2,
            startDay: 12,
            endMonth: 2,
            endDay: 15,
            maxDiscount: 300000,
            minPurchase: 100000,
            enabled: true
        },
        {
            id: 'cyber_monday',
            name: 'دوشنبه سایبری',
            percent: 25,
            startMonth: 11,
            startDay: 28,
            endMonth: 11,
            endDay: 30,
            maxDiscount: 800000,
            minPurchase: 200000,
            enabled: true
        }
    ],
    
    // تخفیف‌های مناسبت‌های ایرانی
    persianDiscounts: [
        {
            id: 'yaldā',
            name: 'تخفیف شب یلدا',
            percent: 20,
            startMonth: 12,
            startDay: 20,
            endMonth: 12,
            endDay: 22,
            maxDiscount: 500000,
            minPurchase: 150000,
            enabled: true
        },
        {
            id: 'chaharshanbeh_suri',
            name: 'تخفیف چهارشنبه سوری',
            percent: 15,
            startMonth: 3,
            startDay: 13,
            endMonth: 3,
            endDay: 15,
            maxDiscount: 300000,
            minPurchase: 100000,
            enabled: true
        },
        {
            id: 'sizdah_bedar',
            name: 'تخفیف سیزده بدر',
            percent: 18,
            startMonth: 4,
            startDay: 1,
            endMonth: 4,
            endDay: 2,
            maxDiscount: 350000,
            minPurchase: 120000,
            enabled: true
        }
    ],
    
    // تخفیف‌های ساعتی (ساعات خلوت)
    hourlyDiscounts: [
        { startHour: 10, endHour: 12, percent: 10, name: 'تخفیف ساعات خلوت صبح' },
        { startHour: 14, endHour: 16, percent: 15, name: 'تخفیف ویژه بعدازظهر' },
        { startHour: 22, endHour: 0, percent: 25, name: 'تخفیف شبانه' }
    ],
    
    // تخفیف‌های روز هفته
    weekdayDiscounts: {
        '1': { percent: 10, name: 'تخفیف یکشنبه‌ها' },    // شنبه
        '2': { percent: 10, name: 'تخفیف دوشنبه‌ها' },    // یکشنبه
        '3': { percent: 15, name: 'تخفیف سه‌شنبه‌ها' },   // دوشنبه
        '4': { percent: 15, name: 'تخفیف چهارشنبه‌ها' },  // سه‌شنبه
        '5': { percent: 20, name: 'تخفیف پنجشنبه‌ها' },   // چهارشنبه
        '6': { percent: 25, name: 'تخفیف جمعه‌ها' },      // پنجشنبه
        '7': { percent: 30, name: 'تخفیف ویژه آخر هفته' }  // جمعه
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadDiscounts();
        this.attachEvents();
        console.log('🍂 سیستم تخفیف فصلی راه‌اندازی شد');
    },
    
    // ===== بارگذاری تخفیف‌ها از localStorage =====
    loadDiscounts: function() {
        const savedSeasonal = localStorage.getItem('seasonal_discounts');
        if (savedSeasonal) {
            try {
                this.seasonalDiscounts = JSON.parse(savedSeasonal);
            } catch(e) {}
        }
        
        const savedPersian = localStorage.getItem('persian_discounts');
        if (savedPersian) {
            try {
                this.persianDiscounts = JSON.parse(savedPersian);
            } catch(e) {}
        }
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('seasonal:check', (data) => {
            return this.getCurrentSeasonalDiscount(data.amount, data.serviceId, data.businessId);
        });
    },
    
    // ===== دریافت تاریخ شمسی فعلی =====
    getCurrentPersianDate: function() {
        // شبیه‌سازی تاریخ شمسی
        const now = new Date();
        return {
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: now.getHours(),
            weekday: now.getDay() + 1
        };
    },
    
    // ===== بررسی تخفیف فصلی =====
    checkSeasonalDiscount: function(amount) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        
        for (const discount of this.seasonalDiscounts) {
            if (!discount.enabled) continue;
            
            // بررسی محدوده تاریخ
            let isActive = false;
            
            if (discount.startMonth <= discount.endMonth) {
                isActive = (currentMonth > discount.startMonth || 
                           (currentMonth === discount.startMonth && currentDay >= discount.startDay)) &&
                          (currentMonth < discount.endMonth || 
                           (currentMonth === discount.endMonth && currentDay <= discount.endDay));
            } else {
                // برای تخفیف‌هایی که سال را رد می‌کنند (مثل زمستان)
                isActive = (currentMonth > discount.startMonth || 
                           (currentMonth === discount.startMonth && currentDay >= discount.startDay)) ||
                          (currentMonth < discount.endMonth || 
                           (currentMonth === discount.endMonth && currentDay <= discount.endDay));
            }
            
            if (isActive && amount >= discount.minPurchase) {
                let discountAmount = (amount * discount.percent) / 100;
                if (discountAmount > discount.maxDiscount) {
                    discountAmount = discount.maxDiscount;
                }
                
                return {
                    active: true,
                    name: discount.name,
                    percent: discount.percent,
                    amount: discountAmount,
                    type: 'seasonal'
                };
            }
        }
        
        return { active: false };
    },
    
    // ===== بررسی تخفیف مناسبت‌های ایرانی =====
    checkPersianDiscount: function(amount) {
        const persianDate = this.getCurrentPersianDate();
        
        for (const discount of this.persianDiscounts) {
            if (!discount.enabled) continue;
            
            if (persianDate.month === discount.startMonth && 
                persianDate.day >= discount.startDay && 
                persianDate.day <= discount.endDay &&
                amount >= discount.minPurchase) {
                
                let discountAmount = (amount * discount.percent) / 100;
                if (discountAmount > discount.maxDiscount) {
                    discountAmount = discount.maxDiscount;
                }
                
                return {
                    active: true,
                    name: discount.name,
                    percent: discount.percent,
                    amount: discountAmount,
                    type: 'persian'
                };
            }
        }
        
        return { active: false };
    },
    
    // ===== بررسی تخفیف ساعتی =====
    checkHourlyDiscount: function(amount) {
        const currentHour = new Date().getHours();
        
        for (const discount of this.hourlyDiscounts) {
            let isActive = false;
            
            if (discount.startHour < discount.endHour) {
                isActive = currentHour >= discount.startHour && currentHour < discount.endHour;
            } else {
                // برای تخفیف‌های شب (مثل 22 تا 0)
                isActive = currentHour >= discount.startHour || currentHour < discount.endHour;
            }
            
            if (isActive) {
                const discountAmount = (amount * discount.percent) / 100;
                
                return {
                    active: true,
                    name: discount.name,
                    percent: discount.percent,
                    amount: discountAmount,
                    type: 'hourly'
                };
            }
        }
        
        return { active: false };
    },
    
    // ===== بررسی تخفیف روز هفته =====
    checkWeekdayDiscount: function(amount) {
        const persianDate = this.getCurrentPersianDate();
        const weekdayDiscount = this.weekdayDiscounts[persianDate.weekday];
        
        if (weekdayDiscount) {
            const discountAmount = (amount * weekdayDiscount.percent) / 100;
            
            return {
                active: true,
                name: weekdayDiscount.name,
                percent: weekdayDiscount.percent,
                amount: discountAmount,
                type: 'weekday'
            };
        }
        
        return { active: false };
    },
    
    // ===== دریافت تخفیف فعلی =====
    getCurrentSeasonalDiscount: function(amount, serviceId = null, businessId = null) {
        // اولویت: فصلی > ایرانی > ساعتی > روز هفته
        let bestDiscount = { active: false, amount: 0 };
        
        // 1. تخفیف فصلی
        const seasonal = this.checkSeasonalDiscount(amount);
        if (seasonal.active && seasonal.amount > bestDiscount.amount) {
            bestDiscount = seasonal;
        }
        
        // 2. تخفیف مناسبت‌های ایرانی
        const persian = this.checkPersianDiscount(amount);
        if (persian.active && persian.amount > bestDiscount.amount) {
            bestDiscount = persian;
        }
        
        // 3. تخفیف ساعتی
        const hourly = this.checkHourlyDiscount(amount);
        if (hourly.active && hourly.amount > bestDiscount.amount) {
            bestDiscount = hourly;
        }
        
        // 4. تخفیف روز هفته
        const weekday = this.checkWeekdayDiscount(amount);
        if (weekday.active && weekday.amount > bestDiscount.amount) {
            bestDiscount = weekday;
        }
        
        return bestDiscount;
    },
    
    // ===== دریافت تخفیف ویژه کسب‌وکار =====
    getBusinessSpecialDiscount: function(businessId, amount) {
        // تخفیف‌های ویژه کسب‌وکارها (از دیتابیس فرضی)
        const businessSpecialDiscounts = {
            1: { percent: 10, name: 'تخفیف ویژه سالن زیبایی لیدا' },
            2: { percent: 15, name: 'تخفیف ویژه کلینیک دکتر محمدی' },
            3: { percent: 5, name: 'تخفیف ویژه آرایشگاه سارا' }
        };
        
        const discount = businessSpecialDiscounts[businessId];
        if (discount) {
            const discountAmount = (amount * discount.percent) / 100;
            return {
                active: true,
                name: discount.name,
                percent: discount.percent,
                amount: discountAmount,
                type: 'business'
            };
        }
        
        return { active: false };
    },
    
    // ===== نمایش مودال تخفیف فصلی =====
    showSeasonalDiscountModal: function(discount) {
        const modal = document.createElement('div');
        modal.id = 'seasonalDiscountModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎉 ${discount.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="discount-offer">
                        <div class="offer-badge">${discount.percent}٪ تخفیف ویژه</div>
                        <p>به مناسبت ${discount.name}، از تخفیف ویژه بهره‌مند شوید!</p>
                        <div class="offer-details">
                            <div class="detail">💎 مبلغ تخفیف: ${this.formatPrice(discount.amount)}</div>
                            <div class="detail">⏰ مدت زمان باقی‌مانده: ${this.getRemainingTime()}</div>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">باشه، استفاده می‌کنم</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    },
    
    // ===== دریافت زمان باقی‌مانده تا پایان تخفیف =====
    getRemainingTime: function() {
        const now = new Date();
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        const diff = endOfYear - now;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        return `${days} روز و ${hours} ساعت`;
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    },
    
    // ===== اضافه کردن تخفیف فصلی جدید =====
    addSeasonalDiscount: function(discount) {
        const newDiscount = {
            id: 'SDS' + Date.now() + Math.random().toString(36).substr(2, 8),
            ...discount,
            enabled: true
        };
        
        this.seasonalDiscounts.push(newDiscount);
        this.saveDiscounts();
        
        App.showToast(`تخفیف ${discount.name} با موفقیت اضافه شد`, 'success');
        return newDiscount;
    },
    
    // ===== غیرفعال کردن تخفیف =====
    disableDiscount: function(discountId, type = 'seasonal') {
        let discounts;
        if (type === 'seasonal') {
            discounts = this.seasonalDiscounts;
        } else {
            discounts = this.persianDiscounts;
        }
        
        const index = discounts.findIndex(d => d.id === discountId);
        if (index !== -1) {
            discounts[index].enabled = false;
            this.saveDiscounts();
            App.showToast('تخفیف غیرفعال شد', 'info');
            return true;
        }
        return false;
    },
    
    // ===== ذخیره تخفیف‌ها =====
    saveDiscounts: function() {
        localStorage.setItem('seasonal_discounts', JSON.stringify(this.seasonalDiscounts));
        localStorage.setItem('persian_discounts', JSON.stringify(this.persianDiscounts));
    }
};

// استایل‌های تخفیف فصلی
const seasonalStyles = `
<style>
.discount-offer {
    text-align: center;
    padding: 20px;
}

.offer-badge {
    display: inline-block;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    color: white;
    padding: 8px 20px;
    border-radius: var(--radius-full);
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
}

.offer-details {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin: 20px 0;
    text-align: right;
}

.detail {
    padding: 8px 0;
    font-size: 14px;
}
</style>
`;

if (!document.querySelector('#seasonal-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'seasonal-styles';
    styleSheet.textContent = seasonalStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    SeasonalDiscount.init();
});

window.SeasonalDiscount = SeasonalDiscount;
