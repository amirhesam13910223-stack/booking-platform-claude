 /* ============================================
   BOOKING-SUMMARY.JS - خلاصه رزرو نوبت
   ============================================ */

const BookingSummaryWidget = {
    // ===== ایجاد ویجت خلاصه رزرو =====
    create: function(booking, options = {}) {
        const {
            showActions = true,
            onCancel = null,
            onReschedule = null,
            onViewDetails = null,
            compact = false
        } = options;
        
        const date = new Date(booking.date).toLocaleDateString('fa-IR');
        const time = booking.time;
        const status = this.getStatusInfo(booking.status);
        
        const widget = document.createElement('div');
        widget.className = `booking-summary-widget ${compact ? 'compact' : ''} ${booking.status}`;
        
        widget.innerHTML = `
            <div class="booking-summary-header">
                <div class="booking-business">
                    <div class="business-icon">🏢</div>
                    <div class="business-info">
                        <h4>${booking.business.name}</h4>
                        <p>${booking.business.address || ''}</p>
                    </div>
                </div>
                <div class="booking-status-badge ${status.class}">
                    ${status.icon} ${status.text}
                </div>
            </div>
            
            <div class="booking-summary-details">
                <div class="detail-row">
                    <span class="detail-label">خدمت:</span>
                    <span class="detail-value">${booking.service.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">تاریخ:</span>
                    <span class="detail-value">${date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ساعت:</span>
                    <span class="detail-value">${time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">مدت:</span>
                    <span class="detail-value">${booking.service.duration} دقیقه</span>
                </div>
                <div class="detail-row price-row">
                    <span class="detail-label">مبلغ:</span>
                    <span class="detail-value">${PriceHelper.formatPrice(booking.finalPrice)}</span>
                </div>
                ${booking.discount > 0 ? `
                    <div class="detail-row discount-row">
                        <span class="detail-label">تخفیف:</span>
                        <span class="detail-value">- ${PriceHelper.formatPrice(booking.discount)}</span>
                    </div>
                ` : ''}
            </div>
            
            ${booking.notes ? `
                <div class="booking-notes">
                    <p>📝 ${booking.notes}</p>
                </div>
            ` : ''}
            
            <div class="booking-qr">
                <img src="${booking.qrCode || 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + booking.id}" alt="QR Code" width="80" height="80">
                <span class="booking-id">کد: ${booking.id}</span>
            </div>
            
            ${showActions ? `
                <div class="booking-summary-actions">
                    <button class="btn btn-outline btn-sm view-details">🔍 جزئیات</button>
                    ${booking.status === 'confirmed' ? `
                        <button class="btn btn-outline btn-sm reschedule">🔄 تغییر زمان</button>
                        <button class="btn btn-danger btn-sm cancel">❌ لغو نوبت</button>
                    ` : ''}
                </div>
            ` : ''}
        `;
        
        // اتصال رویدادها
        if (showActions) {
            widget.querySelector('.view-details')?.addEventListener('click', () => {
                if (onViewDetails) onViewDetails(booking);
            });
            
            widget.querySelector('.reschedule')?.addEventListener('click', () => {
                if (onReschedule) onReschedule(booking);
            });
            
            widget.querySelector('.cancel')?.addEventListener('click', () => {
                if (onCancel) onCancel(booking);
            });
        }
        
        return widget;
    },
    
    // ===== دریافت اطلاعات وضعیت =====
    getStatusInfo: function(status) {
        const statusMap = {
            pending: { icon: '⏳', text: 'در انتظار تأیید', class: 'pending' },
            confirmed: { icon: '✅', text: 'تأیید شده', class: 'confirmed' },
            completed: { icon: '🎉', text: 'انجام شده', class: 'completed' },
            cancelled: { icon: '❌', text: 'لغو شده', class: 'cancelled' }
        };
        return statusMap[status] || statusMap.pending;
    },
    
    // ===== ایجاد لیست نوبت‌ها =====
    createList: function(bookings, options = {}) {
        const container = document.createElement('div');
        container.className = 'bookings-list';
        
        bookings.forEach(booking => {
            const widget = this.create(booking, options);
            container.appendChild(widget);
        });
        
        if (bookings.length === 0) {
            container.innerHTML = '<div class="empty-state">هیچ نوبتی یافت نشد</div>';
        }
        
        return container;
    }
};

// استایل‌های خلاصه رزرو
const bookingSummaryStyles = `
<style>
.booking-summary-widget {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    padding: 1rem;
    margin-bottom: 1rem;
    transition: all var(--transition-fast);
}
.booking-summary-widget:hover {
    box-shadow: var(--shadow-md);
}
.booking-summary-widget.compact {
    padding: 0.75rem;
}
.booking-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
}
.booking-business {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.business-icon {
    width: 40px;
    height: 40px;
    background: var(--color-primary-soft);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
}
.business-info h4 {
    margin-bottom: 0.25rem;
    font-size: 1rem;
}
.business-info p {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin: 0;
}
.booking-status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}
.booking-status-badge.pending {
    background: var(--color-warning-soft);
    color: var(--color-warning);
}
.booking-status-badge.confirmed {
    background: var(--color-success-soft);
    color: var(--color-success);
}
.booking-status-badge.completed {
    background: var(--color-info-soft);
    color: var(--color-info);
}
.booking-status-badge.cancelled {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}
.booking-summary-details {
    margin-bottom: 1rem;
}
.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
    font-size: 0.875rem;
}
.detail-label {
    color: var(--text-tertiary);
}
.price-row .detail-value {
    font-weight: bold;
    color: var(--color-primary);
}
.discount-row {
    color: var(--color-success);
}
.booking-notes {
    background: var(--bg-secondary);
    padding: 0.5rem;
    border-radius: var(--radius-md);
    margin: 0.5rem 0;
    font-size: 0.75rem;
}
.booking-qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0.5rem 0;
}
.booking-id {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin-top: 0.25rem;
}
.booking-summary-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 0.75rem;
}
.bookings-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>
`;

if (!document.querySelector('#booking-summary-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'booking-summary-styles';
    styleSheet.textContent = bookingSummaryStyles;
    document.head.appendChild(styleSheet);
}

window.BookingSummaryWidget = BookingSummaryWidget;
