 /* ============================================
   CANCELLATION.JS - کنسلی و جریمه نوبت
   ============================================ */

const BookingCancellation = {
    // نرخ جریمه بر اساس ساعت باقی‌مانده
    cancellationFees: {
        '48': 0,      // بیش از 48 ساعت: رایگان
        '24': 25,     // 24-48 ساعت: 25%
        '12': 50,     // 12-24 ساعت: 50%
        '6': 75,      // 6-12 ساعت: 75%
        '0': 100      // کمتر از 6 ساعت: 100%
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('❌ ماژول Cancellation راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        // گوش دادن به رویدادهای سیستم
        App.on('booking:cancel-request', (data) => {
            this.showCancelModal(data.booking);
        });
    },
    
    // ===== نمایش مودال کنسلی =====
    showCancelModal: function(booking) {
        const feePercent = this.calculateCancellationFee(booking.date, booking.time);
        const feeAmount = (booking.finalPrice * feePercent) / 100;
        const refundAmount = booking.finalPrice - feeAmount;
        
        const modal = document.createElement('div');
        modal.id = 'cancelModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>❌ لغو نوبت</h3>
                    <button class="modal-close" onclick="BookingCancellation.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>آیا از لغو نوبت زیر مطمئن هستید؟</p>
                    
                    <div class="booking-info">
                        <div class="info-row">
                            <span>کسب‌وکار:</span>
                            <strong>${booking.business.name}</strong>
                        </div>
                        <div class="info-row">
                            <span>خدمت:</span>
                            <strong>${booking.service.name}</strong>
                        </div>
                        <div class="info-row">
                            <span>تاریخ و ساعت:</span>
                            <strong>${this.formatDate(booking.date)} - ${booking.time}</strong>
                        </div>
                        <div class="info-row">
                            <span>مبلغ پرداختی:</span>
                            <strong>${this.formatPrice(booking.finalPrice)}</strong>
                        </div>
                    </div>
                    
                    <div class="cancellation-fee">
                        <div class="fee-row ${feePercent > 0 ? 'warning' : 'success'}">
                            <span>جریمه لغو (${feePercent}%):</span>
                            <strong>${this.formatPrice(feeAmount)}</strong>
                        </div>
                        <div class="refund-row">
                            <span>مبلغ بازگشتی:</span>
                            <strong class="refund-amount">${this.formatPrice(refundAmount)}</strong>
                        </div>
                        ${feePercent > 0 ? '<p class="fee-note">⏰ با توجه به نزدیک بودن زمان نوبت، جریمه لغو اعمال می‌شود</p>' : '<p class="fee-note success">✅ لغو در این زمان جریمه ندارد</p>'}
                    </div>
                    
                    <div class="form-group">
                        <label>دلیل لغو (اختیاری)</label>
                        <textarea id="cancelReason" class="form-control" rows="3" placeholder="دلیل لغو نوبت..."></textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="BookingCancellation.closeModal()">انصراف</button>
                        <button class="btn btn-danger" id="confirmCancelBtn">تأیید لغو</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('confirmCancelBtn')?.addEventListener('click', () => {
            this.confirmCancellation(booking, feeAmount, refundAmount);
        });
    },
    
    // ===== محاسبه جریمه کنسلی =====
    calculateCancellationFee: function(bookingDate, bookingTime) {
        const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
        const now = new Date();
        const hoursRemaining = (bookingDateTime - now) / (1000 * 60 * 60);
        
        if (hoursRemaining >= 48) return this.cancellationFees['48'];
        if (hoursRemaining >= 24) return this.cancellationFees['24'];
        if (hoursRemaining >= 12) return this.cancellationFees['12'];
        if (hoursRemaining >= 6) return this.cancellationFees['6'];
        return this.cancellationFees['0'];
    },
    
    // ===== تأیید کنسلی =====
    confirmCancellation: async function(booking, feeAmount, refundAmount) {
        const reason = document.getElementById('cancelReason')?.value;
        
        App.showToast('در حال لغو نوبت...', 'info');
        
        await this.delay(1000);
        
        // به‌روزرسانی وضعیت نوبت
        booking.status = 'cancelled';
        booking.cancelledAt = new Date().toISOString();
        booking.cancellationReason = reason;
        booking.cancellationFee = feeAmount;
        booking.refundAmount = refundAmount;
        
        // به‌روزرسانی در localStorage
        const userBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const index = userBookings.findIndex(b => b.id === booking.id);
        if (index !== -1) {
            userBookings[index] = booking;
            localStorage.setItem('user_bookings', JSON.stringify(userBookings));
        }
        
        // ارسال رویداد
        App.emit(SystemEvents.BOOKING_CANCELLED, booking);
        
        // نمایش پیام
        if (feeAmount > 0) {
            App.showToast(`نوبت لغو شد. مبلغ ${this.formatPrice(refundAmount)} به کیف پول شما برگشت`, 'warning');
        } else {
            App.showToast('نوبت با موفقیت لغو شد', 'success');
        }
        
        // بستن مودال
        this.closeModal();
        
        // به‌روزرسانی لیست نوبت‌ها
        App.emit('bookings:updated');
    },
    
    // ===== بررسی امکان لغو =====
    canCancel: function(booking) {
        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
        const now = new Date();
        return bookingDateTime > now && booking.status === 'confirmed';
    },
    
    // ===== دریافت زمان باقی‌مانده =====
    getRemainingTime: function(booking) {
        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
        const now = new Date();
        const diffMs = bookingDateTime - now;
        
        if (diffMs <= 0) return 'زمان گذشته';
        
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours >= 24) {
            const days = Math.floor(diffHours / 24);
            return `${days} روز باقی‌مانده`;
        }
        
        return `${diffHours} ساعت و ${diffMinutes} دقیقه باقی‌مانده`;
    },
    
    // ===== بستن مودال =====
    closeModal: function() {
        const modal = document.getElementById('cancelModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    },
    
    // ===== توابع کمکی =====
    formatDate: function(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fa-IR');
    },
    
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    },
    
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// استایل‌های مودال کنسلی
const cancelStyles = `
<style>
.booking-info {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 12px;
    margin: 15px 0;
}

.info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
}

.info-row:last-child {
    border-bottom: none;
}

.cancellation-fee {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 12px;
    margin: 15px 0;
}

.fee-row, .refund-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
}

.fee-row.warning {
    color: var(--color-danger);
}

.fee-row.success {
    color: var(--color-success);
}

.refund-amount {
    color: var(--color-success);
    font-size: 18px;
}

.fee-note {
    font-size: 12px;
    color: var(--color-danger);
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
}

.fee-note.success {
    color: var(--color-success);
}

.modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
}

.btn-danger {
    background-color: var(--color-danger);
    color: white;
}

.btn-danger:hover {
    background-color: var(--color-danger-dark);
}
</style>
`;

if (!document.querySelector('#cancel-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'cancel-styles';
    styleSheet.textContent = cancelStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    BookingCancellation.init();
});

window.BookingCancellation = BookingCancellation;
