 /* ============================================
   RESCHEDULE.JS - تغییر زمان نوبت
   ============================================ */

const BookingReschedule = {
    // نوبت جاری برای تغییر
    currentBooking: null,
    newDate: null,
    newTime: null,
    
    availableTimes: [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
    ],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('🔄 ماژول Reschedule راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('booking:reschedule-request', (data) => {
            this.showRescheduleModal(data.booking);
        });
    },
    
    // ===== نمایش مودال تغییر زمان =====
    showRescheduleModal: function(booking) {
        this.currentBooking = booking;
        this.newDate = null;
        this.newTime = null;
        
        const modal = document.createElement('div');
        modal.id = 'rescheduleModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔄 تغییر زمان نوبت</h3>
                    <button class="modal-close" onclick="BookingReschedule.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="current-booking-info">
                        <h4>نوبت فعلی:</h4>
                        <p>${booking.business.name} - ${booking.service.name}</p>
                        <p class="current-time">📅 ${this.formatDate(booking.date)} - ${booking.time}</p>
                    </div>
                    
                    <div class="new-booking-info">
                        <h4>زمان جدید:</h4>
                        <div class="form-group">
                            <label>انتخاب تاریخ جدید</label>
                            <input type="date" id="newDate" class="form-control" min="${this.getMinDate()}">
                        </div>
                        <div class="form-group">
                            <label>انتخاب ساعت جدید</label>
                            <div id="newTimeSlots" class="time-slots-grid"></div>
                        </div>
                    </div>
                    
                    <div class="reschedule-note">
                        <p class="note-info">ℹ️ تغییر زمان نوبت جریمه ندارد، در صورت عدم وجود زمان مناسب، می‌توانید نوبت را لغو کنید.</p>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="BookingReschedule.closeModal()">انصراف</button>
                        <button class="btn btn-primary" id="confirmRescheduleBtn" disabled>تأیید تغییر زمان</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // اتصال رویدادها
        const dateInput = document.getElementById('newDate');
        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                this.newDate = e.target.value;
                this.loadTimeSlots();
            });
        }
        
        document.getElementById('confirmRescheduleBtn')?.addEventListener('click', () => {
            this.confirmReschedule();
        });
    },
    
    // ===== بارگذاری ساعات =====
    loadTimeSlots: function() {
        const container = document.getElementById('newTimeSlots');
        if (!container) return;
        
        // شبیه‌سازی ساعات پر شده (به غیر از زمان فعلی)
        const bookedTimes = ['10:00', '14:30'];
        
        container.innerHTML = this.availableTimes.map(time => `
            <div class="time-slot ${bookedTimes.includes(time) ? 'booked' : ''} ${this.currentBooking.time === time ? 'current' : ''}" data-time="${time}">
                ${time}
                ${this.currentBooking.time === time ? ' (زمان فعلی)' : ''}
            </div>
        `).join('');
        
        // اتصال رویداد انتخاب ساعت
        document.querySelectorAll('#newTimeSlots .time-slot:not(.booked)').forEach(slot => {
            slot.addEventListener('click', () => {
                document.querySelectorAll('#newTimeSlots .time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                this.newTime = slot.dataset.time;
                document.getElementById('confirmRescheduleBtn').disabled = false;
            });
        });
    },
    
    // ===== تأیید تغییر زمان =====
    confirmReschedule: async function() {
        if (!this.newDate || !this.newTime) {
            App.showToast('لطفاً تاریخ و ساعت جدید را انتخاب کنید', 'warning');
            return;
        }
        
        // بررسی عدم تغییر (انتخاب زمان فعلی)
        if (this.newDate === this.currentBooking.date && this.newTime === this.currentBooking.time) {
            App.showToast('زمان جدید با زمان فعلی یکسان است', 'warning');
            return;
        }
        
        App.showToast('در حال تغییر زمان نوبت...', 'info');
        
        await this.delay(1000);
        
        // ثبت زمان قبلی برای تاریخچه
        const oldDateTime = `${this.currentBooking.date} ${this.currentBooking.time}`;
        
        // به‌روزرسانی نوبت
        this.currentBooking.date = this.newDate;
        this.currentBooking.time = this.newTime;
        this.currentBooking.rescheduledAt = new Date().toISOString();
        this.currentBooking.previousTime = oldDateTime;
        
        // به‌روزرسانی در localStorage
        const userBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const index = userBookings.findIndex(b => b.id === this.currentBooking.id);
        if (index !== -1) {
            userBookings[index] = this.currentBooking;
            localStorage.setItem('user_bookings', JSON.stringify(userBookings));
        }
        
        // ارسال رویداد
        App.emit(SystemEvents.BOOKING_UPDATED, this.currentBooking);
        
        App.showToast(`✅ زمان نوبت با موفقیت به ${this.formatDate(this.newDate)} - ${this.newTime} تغییر یافت`, 'success');
        
        this.closeModal();
    },
    
    // ===== بررسی امکان تغییر زمان =====
    canReschedule: function(booking) {
        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
        const now = new Date();
        const hoursRemaining = (bookingDateTime - now) / (1000 * 60 * 60);
        
        // فقط تا 2 ساعت قبل از نوبت امکان تغییر وجود دارد
        return hoursRemaining >= 2 && booking.status === 'confirmed';
    },
    
    // ===== بستن مودال =====
    closeModal: function() {
        const modal = document.getElementById('rescheduleModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
        this.currentBooking = null;
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

// استایل‌های مودال تغییر زمان
const rescheduleStyles = `
<style>
.current-booking-info {
    background: var(--color-primary-soft);
    border-radius: var(--radius-md);
    padding: 12px;
    margin-bottom: 20px;
}

.current-booking-info h4 {
    margin-bottom: 8px;
    color: var(--color-primary);
}

.current-time {
    color: var(--color-primary);
    font-weight: bold;
    margin-top: 8px;
}

.new-booking-info {
    margin: 20px 0;
}

.new-booking-info h4 {
    margin-bottom: 15px;
}

.time-slot.current {
    background: var(--color-primary-soft);
    border-color: var(--color-primary);
}

.reschedule-note {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 12px;
    margin: 15px 0;
}

.note-info {
    font-size: 13px;
    color: var(--text-tertiary);
    margin: 0;
}
</style>
`;

if (!document.querySelector('#reschedule-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'reschedule-styles';
    styleSheet.textContent = rescheduleStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    BookingReschedule.init();
});

window.BookingReschedule = BookingReschedule;
