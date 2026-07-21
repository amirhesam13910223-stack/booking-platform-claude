 /* ============================================
   DEPOSIT.JS - سیستم بیعانه
   ============================================ */

const DepositSystem = {
    // درصد بیعانه پیش‌فرض بر اساس نوع خدمت
    depositRates: {
        default: 10,
        premium: 25,
        luxury: 50,
        group: 30
    },
    
    // قوانین جریمه کنسلی
    cancellationRules: {
        '48': { percent: 0, label: 'بیشتر از 48 ساعت' },
        '24': { percent: 25, label: '24 تا 48 ساعت' },
        '12': { percent: 50, label: '12 تا 24 ساعت' },
        '6': { percent: 75, label: '6 تا 12 ساعت' },
        '0': { percent: 100, label: 'کمتر از 6 ساعت' }
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('💰 ماژول DepositSystem راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('deposit:request', (data) => {
            this.processDeposit(data);
        });
        
        App.on('booking:cancelled', (data) => {
            this.handleCancellationDeposit(data);
        });
    },
    
    // ===== محاسبه مبلغ بیعانه =====
    calculateDeposit: function(amount, serviceType = 'default') {
        const rate = this.depositRates[serviceType] || this.depositRates.default;
        const depositAmount = (amount * rate) / 100;
        
        return {
            originalAmount: amount,
            depositRate: rate,
            depositAmount: depositAmount,
            remainingAmount: amount - depositAmount
        };
    },
    
    // ===== پردازش بیعانه =====
    processDeposit: async function(data) {
        const { bookingId, amount, serviceType, callback } = data;
        
        const depositInfo = this.calculateDeposit(amount, serviceType);
        
        // نمایش مودال تأیید بیعانه
        this.showDepositModal(bookingId, depositInfo, callback);
    },
    
    // ===== نمایش مودال بیعانه =====
    showDepositModal: function(bookingId, depositInfo, callback) {
        const modal = document.createElement('div');
        modal.id = 'depositModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💰 پرداخت بیعانه</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="deposit-info">
                        <div class="info-row">
                            <span>مبلغ کل:</span>
                            <strong>${this.formatPrice(depositInfo.originalAmount)}</strong>
                        </div>
                        <div class="info-row highlight">
                            <span>مبلغ بیعانه (${depositInfo.depositRate}%):</span>
                            <strong class="deposit-amount">${this.formatPrice(depositInfo.depositAmount)}</strong>
                        </div>
                        <div class="info-row">
                            <span>مبلغ قابل پرداخت در محل:</span>
                            <strong>${this.formatPrice(depositInfo.remainingAmount)}</strong>
                        </div>
                    </div>
                    
                    <div class="cancellation-rules">
                        <h4>قوانین کنسلی و جریمه:</h4>
                        ${Object.entries(this.cancellationRules).map(([hours, rule]) => `
                            <div class="rule-row">
                                <span>⏰ ${rule.label}:</span>
                                <span class="${rule.percent > 0 ? 'text-danger' : 'text-success'}">
                                    ${rule.percent === 0 ? 'بدون جریمه' : `${rule.percent}% جریمه از بیعانه`}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="form-group">
                        <label>انتخاب درگاه پرداخت</label>
                        <select id="depositGateway" class="form-control">
                            ${PaymentGatewayHandler.getGateways().map(g => `<option value="${g.id}">${g.icon} ${g.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                        <button class="btn btn-primary" id="confirmDepositBtn">پرداخت بیعانه</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('confirmDepositBtn')?.addEventListener('click', async () => {
            const gateway = document.getElementById('depositGateway')?.value;
            
            const paymentResult = await PaymentGatewayHandler.processPayment({
                amount: depositInfo.depositAmount,
                description: `بیعانه رزرو شماره ${bookingId}`,
                gateway: gateway,
                callback: (transaction) => {
                    this.onDepositSuccess(bookingId, depositInfo, transaction, callback);
                }
            });
            
            if (!paymentResult) {
                App.showToast('خطا در اتصال به درگاه پرداخت', 'error');
            }
        });
    },
    
    // ===== موفقیت در پرداخت بیعانه =====
    onDepositSuccess: function(bookingId, depositInfo, transaction, callback) {
        // ذخیره اطلاعات بیعانه
        const depositRecord = {
            bookingId: bookingId,
            amount: depositInfo.depositAmount,
            rate: depositInfo.depositRate,
            transactionId: transaction.id,
            status: 'paid',
            paidAt: new Date().toISOString()
        };
        
        const deposits = JSON.parse(localStorage.getItem('deposits') || '[]');
        deposits.push(depositRecord);
        localStorage.setItem('deposits', JSON.stringify(deposits));
        
        App.showToast(`بیعانه ${this.formatPrice(depositInfo.depositAmount)} با موفقیت پرداخت شد`, 'success');
        
        if (callback) {
            callback(depositRecord);
        }
        
        // بستن مودال
        const modal = document.getElementById('depositModal');
        if (modal) modal.remove();
        document.body.style.overflow = '';
    },
    
    // ===== مدیریت بیعانه در کنسلی =====
    handleCancellationDeposit: function(booking) {
        const deposits = JSON.parse(localStorage.getItem('deposits') || '[]');
        const deposit = deposits.find(d => d.bookingId === booking.id);
        
        if (!deposit) return;
        
        // محاسبه ساعت باقی‌مانده تا نوبت
        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
        const now = new Date();
        const hoursRemaining = (bookingDateTime - now) / (1000 * 60 * 60);
        
        // تعیین جریمه
        let feePercent = 0;
        if (hoursRemaining >= 48) feePercent = this.cancellationRules['48'].percent;
        else if (hoursRemaining >= 24) feePercent = this.cancellationRules['24'].percent;
        else if (hoursRemaining >= 12) feePercent = this.cancellationRules['12'].percent;
        else if (hoursRemaining >= 6) feePercent = this.cancellationRules['6'].percent;
        else feePercent = this.cancellationRules['0'].percent;
        
        const feeAmount = (deposit.amount * feePercent) / 100;
        const refundAmount = deposit.amount - feeAmount;
        
        // به‌روزرسانی اطلاعات بیعانه
        deposit.status = 'cancelled';
        deposit.cancelledAt = new Date().toISOString();
        deposit.cancellationFee = feeAmount;
        deposit.refundAmount = refundAmount;
        
        localStorage.setItem('deposits', JSON.stringify(deposits));
        
        // اطلاع به کاربر
        if (feeAmount > 0) {
            App.showToast(`نوبت لغو شد. مبلغ ${this.formatPrice(refundAmount)} به حساب شما برگشت داده شد. جریمه: ${this.formatPrice(feeAmount)}`, 'warning');
        } else {
            App.showToast(`نوبت لغو شد. مبلغ بیعانه به طور کامل برگشت داده شد`, 'info');
        }
    },
    
    // ===== دریافت بیعانه رزرو =====
    getDepositByBooking: function(bookingId) {
        const deposits = JSON.parse(localStorage.getItem('deposits') || '[]');
        return deposits.find(d => d.bookingId === bookingId);
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// استایل‌های مودال بیعانه
const depositStyles = `
<style>
.deposit-info {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
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

.info-row.highlight {
    background: var(--color-primary-soft);
    margin: 0 -15px;
    padding: 12px 15px;
    border-radius: var(--radius-md);
}

.deposit-amount {
    color: var(--color-primary);
    font-size: 18px;
}

.cancellation-rules {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin: 20px 0;
}

.cancellation-rules h4 {
    margin-bottom: 12px;
}

.rule-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
}

.text-danger {
    color: var(--color-danger);
}

.text-success {
    color: var(--color-success);
}
</style>
`;

if (!document.querySelector('#deposit-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'deposit-styles';
    styleSheet.textContent = depositStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    DepositSystem.init();
});

window.DepositSystem = DepositSystem;
