 /* ============================================
   RECURRING-BOOKING.JS - نوبت‌های تکراری
   ============================================ */

const BookingRecurring = {
    // نوبت‌های تکراری فعال
    recurringBookings: [],
    
    // الگوهای تکرار
    patterns: {
        'daily': { days: 1, label: 'روزانه' },
        'weekly': { days: 7, label: 'هفتگی' },
        'biweekly': { days: 14, label: 'دو هفته یکبار' },
        'monthly': { days: 30, label: 'ماهانه' }
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadRecurringBookings();
        this.attachEvents();
        console.log('🔄 ماژول RecurringBooking راه‌اندازی شد');
    },
    
    // ===== بارگذاری نوبت‌های تکراری =====
    loadRecurringBookings: function() {
        const saved = localStorage.getItem('recurring_bookings');
        if (saved) {
            this.recurringBookings = JSON.parse(saved);
        }
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('booking:recurring-request', () => {
            this.showRecurringModal();
        });
    },
    
    // ===== نمایش مودال نوبت تکراری =====
    showRecurringModal: function() {
        const modal = document.createElement('div');
        modal.id = 'recurringModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔄 نوبت تکراری</h3>
                    <button class="modal-close" onclick="BookingRecurring.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>انتخاب کسب‌وکار</label>
                        <select id="recurringBusiness" class="form-control">
                            <option value="">انتخاب کنید...</option>
                            ${BookingReservation.businesses.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>انتخاب خدمت</label>
                        <select id="recurringService" class="form-control" disabled>
                            <option value="">ابتدا کسب‌وکار را انتخاب کنید</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>الگوی تکرار</label>
                        <select id="recurringPattern" class="form-control">
                            ${Object.entries(this.patterns).map(([key, p]) => `<option value="${key}">${p.label}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>تاریخ شروع</label>
                        <input type="date" id="recurringStartDate" class="form-control" min="${this.getMinDate()}">
                    </div>
                    
                    <div class="form-group">
                        <label>ساعت</label>
                        <select id="recurringTime" class="form-control">
                            ${BookingReservation.availableTimes.map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>تعداد جلسات (حداکثر ۱۲)</label>
                        <input type="number" id="recurringCount" class="form-control" min="2" max="12" value="4">
                    </div>
                    
                    <div class="recurring-summary" id="recurringSummary"></div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="BookingRecurring.closeModal()">انصراف</button>
                        <button class="btn btn-primary" id="createRecurringBtn">ایجاد نوبت تکراری</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        this.attachRecurringEvents();
    },
    
    // ===== اتصال رویدادهای مودال تکراری =====
    attachRecurringEvents: function() {
        const businessSelect = document.getElementById('recurringBusiness');
        const serviceSelect = document.getElementById('recurringService');
        const patternSelect = document.getElementById('recurringPattern');
        const startDate = document.getElementById('recurringStartDate');
        const countInput = document.getElementById('recurringCount');
        
        businessSelect?.addEventListener('change', (e) => {
            const businessId = parseInt(e.target.value);
            if (businessId) {
                const services = BookingReservation.services.filter(s => s.businessId === businessId);
                serviceSelect.innerHTML = '<option value="">انتخاب کنید...</option>' + 
                    services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
                serviceSelect.disabled = false;
            }
        });
        
        const updateSummary = () => {
            const pattern = patternSelect?.value;
            const start = startDate?.value;
            const count = parseInt(countInput?.value || 4);
            
            if (pattern && start && count) {
                const dates = this.generateRecurringDates(start, pattern, count);
                document.getElementById('recurringSummary').innerHTML = `
                    <h4>خلاصه نوبت‌های تکراری:</h4>
                    <div class="dates-list">
                        ${dates.map(date => `<div class="date-item">📅 ${this.formatDate(date)}</div>`).join('')}
                    </div>
                    <p class="total-count">تعداد کل جلسات: ${dates.length}</p>
                `;
            }
        };
        
        patternSelect?.addEventListener('change', updateSummary);
        startDate?.addEventListener('change', updateSummary);
        countInput?.addEventListener('change', updateSummary);
        
        document.getElementById('createRecurringBtn')?.addEventListener('click', () => {
            this.createRecurringBooking();
        });
    },
    
    // ===== ایجاد نوبت تکراری =====
    createRecurringBooking: async function() {
        const businessId = document.getElementById('recurringBusiness')?.value;
        const serviceId = document.getElementById('recurringService')?.value;
        const pattern = document.getElementById('recurringPattern')?.value;
        const startDate = document.getElementById('recurringStartDate')?.value;
        const time = document.getElementById('recurringTime')?.value;
        const count = parseInt(document.getElementById('recurringCount')?.value);
        
        if (!businessId || !serviceId || !pattern || !startDate || !time || count < 2) {
            App.showToast('لطفاً تمام اطلاعات را کامل کنید', 'warning');
            return;
        }
        
        const business = BookingReservation.businesses.find(b => b.id === parseInt(businessId));
        const service = BookingReservation.services.find(s => s.id === parseInt(serviceId));
        
        // تولید تاریخ‌های تکراری
        const recurringDates = this.generateRecurringDates(startDate, pattern, count);
        
        // محاسبه تخفیف ویژه نوبت تکراری (۱۰٪)
        const discount = 10;
        const originalTotal = service.price * recurringDates.length;
        const discountedTotal = originalTotal * (100 - discount) / 100;
        
        App.showToast('در حال ایجاد نوبت‌های تکراری...', 'info');
        
        await this.delay(1500);
        
        const recurringId = 'RPT' + Date.now();
        
        const recurringBooking = {
            id: recurringId,
            business: business,
            service: service,
            pattern: pattern,
            patternLabel: this.patterns[pattern].label,
            startDate: startDate,
            time: time,
            count: count,
            dates: recurringDates,
            originalPrice: originalTotal,
            discount: discount,
            finalPrice: discountedTotal,
            status: 'active',
            createdAt: new Date().toISOString(),
            remainingCount: count
        };
        
        // ذخیره
        this.recurringBookings.push(recurringBooking);
        this.saveRecurringBookings();
        
        App.showToast(`✅ نوبت تکراری با ${discount}% تخفیف ثبت شد! ${count} جلسه`, 'success');
        
        this.closeModal();
    },
    
    // ===== تولید تاریخ‌های تکراری =====
    generateRecurringDates: function(startDate, pattern, count) {
        const dates = [];
        let current = new Date(startDate);
        const patternDays = this.patterns[pattern].days;
        
        for (let i = 0; i < count; i++) {
            if (i > 0) {
                current.setDate(current.getDate() + patternDays);
            }
            dates.push(current.toISOString().split('T')[0]);
        }
        
        return dates;
    },
    
    // ===== دریافت نوبت‌های تکراری فعال =====
    getActiveRecurringBookings: function() {
        return this.recurringBookings.filter(r => r.status === 'active');
    },
    
    // ===== لغو نوبت تکراری =====
    cancelRecurringBooking: async function(recurringId) {
        const index = this.recurringBookings.findIndex(r => r.id === recurringId);
        if (index !== -1) {
            this.recurringBookings[index].status = 'cancelled';
            this.recurringBookings[index].cancelledAt = new Date().toISOString();
            this.saveRecurringBookings();
            
            App.showToast('نوبت تکراری لغو شد', 'warning');
            App.emit('recurring:cancelled', this.recurringBookings[index]);
        }
    },
    
    // ===== ذخیره نوبت‌های تکراری =====
    saveRecurringBookings: function() {
        localStorage.setItem('recurring_bookings', JSON.stringify(this.recurringBookings));
    },
    
    // ===== بستن مودال =====
    closeModal: function() {
        const modal = document.getElementById('recurringModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    },
    
    // ===== توابع کمکی =====
    getMinDate: function() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    },
    
    formatDate: function(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fa-IR');
    },
    
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// استایل‌های مودال تکراری
const recurringStyles = `
<style>
.recurring-summary {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin: 20px 0;
}

.dates-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0;
}

.date-item {
    background: var(--bg-primary);
    padding: 5px 10px;
    border-radius: var(--radius-full);
    font-size: 12px;
}

.total-count {
    margin-top: 10px;
    font-weight: bold;
    color: var(--color-primary);
}
</style>
`;

if (!document.querySelector('#recurring-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'recurring-styles';
    styleSheet.textContent = recurringStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    BookingRecurring.init();
});

window.BookingRecurring = BookingRecurring;
