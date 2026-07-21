 /* ============================================
   GROUP-DISCOUNT.JS - تخفیف گروهی
   ============================================ */

const GroupDiscount = {
    // تخفیف‌های گروهی بر اساس تعداد نفرات
    groupDiscountRates: {
        2: { percent: 5, name: 'تخفیف دوستانه' },
        3: { percent: 10, name: 'تخفیف گروه کوچک' },
        4: { percent: 12, name: 'تخفیف گروهی' },
        5: { percent: 15, name: 'تخفیف گروه متوسط' },
        6: { percent: 18, name: 'تخفیف گروهی ویژه' },
        7: { percent: 20, name: 'تخفیف گروه بزرگ' },
        8: { percent: 22, name: 'تخفیف دورهمی' },
        10: { percent: 25, name: 'تخفیف فوق‌العاده' }
    },
    
    // حداکثر تخفیف گروهی
    maxGroupDiscount: 30,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('👥 سیستم تخفیف گروهی راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('group-discount:calculate', (data) => {
            return this.calculateGroupDiscount(data.groupSize, data.amount);
        });
    },
    
    // ===== محاسبه تخفیف گروهی =====
    calculateGroupDiscount: function(groupSize, amount) {
        if (groupSize < 2) return { amount: 0, percent: 0, name: null };
        
        // یافتن تخفیف مناسب
        let discountRate = 0;
        let discountName = '';
        
        const sizes = Object.keys(this.groupDiscountRates)
            .map(Number)
            .sort((a, b) => b - a);
        
        for (const size of sizes) {
            if (groupSize >= size) {
                discountRate = this.groupDiscountRates[size].percent;
                discountName = this.groupDiscountRates[size].name;
                break;
            }
        }
        
        // محدودیت حداکثر تخفیف
        if (discountRate > this.maxGroupDiscount) {
            discountRate = this.maxGroupDiscount;
        }
        
        const discountAmount = (amount * discountRate) / 100;
        
        return {
            amount: discountAmount,
            percent: discountRate,
            name: discountName,
            groupSize: groupSize
        };
    },
    
    // ===== دریافت نرخ تخفیف برای تعداد نفرات =====
    getDiscountRateForGroup: function(groupSize) {
        const sizes = Object.keys(this.groupDiscountRates)
            .map(Number)
            .sort((a, b) => b - a);
        
        for (const size of sizes) {
            if (groupSize >= size) {
                return this.groupDiscountRates[size];
            }
        }
        
        return { percent: 0, name: null };
    },
    
    // ===== محاسبه قیمت نهایی گروهی =====
    calculateGroupPrice: function(unitPrice, groupSize) {
        const discount = this.calculateGroupDiscount(groupSize, unitPrice * groupSize);
        
        return {
            originalTotal: unitPrice * groupSize,
            discountAmount: discount.amount,
            finalTotal: (unitPrice * groupSize) - discount.amount,
            discountPercent: discount.percent,
            discountName: discount.name,
            pricePerPerson: ((unitPrice * groupSize) - discount.amount) / groupSize
        };
    },
    
    // ===== نمایش تخفیف گروهی =====
    showGroupDiscountInfo: function() {
        const modal = document.createElement('div');
        modal.id = 'groupDiscountModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👥 تخفیف گروهی</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>هرچه تعداد افراد بیشتر باشد، تخفیف بیشتری دریافت می‌کنید!</p>
                    <div class="group-discount-table">
                        ${Object.entries(this.groupDiscountRates).map(([size, data]) => `
                            <div class="discount-row">
                                <span>${size} نفر</span>
                                <span class="discount-badge">${data.percent}٪ تخفیف</span>
                                <span class="discount-name">${data.name}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="group-example">
                        <h4>مثال:</h4>
                        <p>قیمت هر نفر: ۲۰۰,۰۰۰ تومان</p>
                        <p>تعداد نفرات: ۵ نفر → ۱۵٪ تخفیف</p>
                        <p>قیمت کل: ۱,۰۰۰,۰۰۰ تومان</p>
                        <p>تخفیف: ۱۵۰,۰۰۰ تومان</p>
                        <p><strong>قیمت نهایی: ۸۵۰,۰۰۰ تومان</strong></p>
                        <p>هزینه هر نفر: ۱۷۰,۰۰۰ تومان</p>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">متوجه شدم</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }
};

// استایل‌های تخفیف گروهی
const groupDiscountStyles = `
<style>
.group-discount-table {
    margin: 20px 0;
}

.discount-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid var(--border-color);
}

.discount-badge {
    background: var(--color-success-soft);
    color: var(--color-success);
    padding: 4px 8px;
    border-radius: var(--radius-full);
    font-size: 12px;
}

.discount-name {
    color: var(--text-tertiary);
    font-size: 12px;
}

.group-example {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-top: 20px;
}

.group-example h4 {
    margin-bottom: 10px;
}

.group-example p {
    margin-bottom: 5px;
    font-size: 14px;
}
</style>
`;

if (!document.querySelector('#group-discount-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'group-discount-styles';
    styleSheet.textContent = groupDiscountStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    GroupDiscount.init();
});

window.GroupDiscount = GroupDiscount;
