 /* ============================================
   VERIFICATION.JS - تأیید پرداخت
   ============================================ */

const PaymentVerification = {
    // ===== مقداردهی اولیه =====
    init: function() {
        this.checkCallback();
        this.attachEvents();
        console.log('🔍 ماژول PaymentVerification راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('payment:callback-received', (data) => {
            this.verifyCallback(data);
        });
    },
    
    // ===== بررسی Callback =====
    checkCallback: function() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // بررسی پارامترهای درگاه‌های مختلف
        const authority = urlParams.get('Authority');
        const orderId = urlParams.get('order_id');
        const transId = urlParams.get('trans_id');
        const trackId = urlParams.get('track_id');
        const token = urlParams.get('token');
        const status = urlParams.get('status');
        
        if (authority) {
            // زرین‌پال
            this.verifyZarinpal(authority);
        } else if (orderId) {
            // آیدی‌پی
            this.verifyIDpay(orderId);
        } else if (transId) {
            // نکست‌پی
            this.verifyNextpay(transId);
        } else if (trackId) {
            // زیبال
            this.verifyZibal(trackId);
        } else if (token) {
            // وندار
            this.verifyVandar(token);
        }
        
        // حذف پارامترها از URL
        if (authority || orderId || transId || trackId || token) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    },
    
    // ===== تأیید زرین‌پال =====
    verifyZarinpal: async function(authority) {
        App.showToast('در حال تأیید پرداخت...', 'info');
        
        // دریافت مبلغ از localStorage
        const paymentData = localStorage.getItem(`zarinpal_${authority}`);
        let amount = 0;
        
        if (paymentData) {
            try {
                const data = JSON.parse(paymentData);
                amount = data.amount;
            } catch(e) {}
        }
        
        const result = await ZarinpalGateway.verifyPayment(authority, amount);
        
        if (result.success) {
            this.onVerificationSuccess({
                gateway: 'zarinpal',
                refId: result.refId,
                amount: amount,
                authority: authority
            });
        } else {
            this.onVerificationFailed(result.message);
        }
    },
    
    // ===== تأیید آیدی‌پی =====
    verifyIDpay: async function(orderId) {
        App.showToast('در حال تأیید پرداخت...', 'info');
        
        const paymentData = localStorage.getItem(`idpay_${orderId}`);
        let amount = 0;
        
        if (paymentData) {
            try {
                const data = JSON.parse(paymentData);
                amount = data.amount;
            } catch(e) {}
        }
        
        const result = await IDpayGateway.verifyPayment(orderId, amount);
        
        if (result.success) {
            this.onVerificationSuccess({
                gateway: 'idpay',
                refId: result.trackId,
                amount: amount,
                orderId: orderId
            });
        } else {
            this.onVerificationFailed(result.message);
        }
    },
    
    // ===== تأیید نکست‌پی =====
    verifyNextpay: async function(transId) {
        App.showToast('در حال تأیید پرداخت...', 'info');
        
        const paymentData = localStorage.getItem(`nextpay_${transId}`);
        let amount = 0;
        
        if (paymentData) {
            try {
                const data = JSON.parse(paymentData);
                amount = data.amount;
            } catch(e) {}
        }
        
        const result = await NextpayGateway.verifyPayment(transId, amount);
        
        if (result.success) {
            this.onVerificationSuccess({
                gateway: 'nextpay',
                refId: result.refId,
                amount: amount,
                transId: transId
            });
        } else {
            this.onVerificationFailed(result.message);
        }
    },
    
    // ===== تأیید زیبال =====
    verifyZibal: async function(trackId) {
        App.showToast('در حال تأیید پرداخت...', 'info');
        
        const paymentData = localStorage.getItem(`zibal_${trackId}`);
        let amount = 0;
        
        if (paymentData) {
            try {
                const data = JSON.parse(paymentData);
                amount = data.amount;
            } catch(e) {}
        }
        
        const result = await ZibalGateway.verifyPayment(trackId, amount);
        
        if (result.success) {
            this.onVerificationSuccess({
                gateway: 'zibal',
                refId: result.refNumber,
                amount: amount,
                trackId: trackId
            });
        } else {
            this.onVerificationFailed(result.message);
        }
    },
    
    // ===== تأیید وندار =====
    verifyVandar: async function(token) {
        App.showToast('در حال تأیید پرداخت...', 'info');
        
        const paymentData = localStorage.getItem(`vandar_${token}`);
        let amount = 0;
        
        if (paymentData) {
            try {
                const data = JSON.parse(paymentData);
                amount = data.amount;
            } catch(e) {}
        }
        
        const result = await VandarGateway.verifyPayment(token, amount);
        
        if (result.success) {
            this.onVerificationSuccess({
                gateway: 'vandar',
                refId: result.refId,
                amount: amount,
                token: token
            });
        } else {
            this.onVerificationFailed(result.message);
        }
    },
    
    // ===== موفقیت در تأیید =====
    onVerificationSuccess: function(data) {
        // به‌روزرسانی تراکنش
        PaymentGatewayHandler.updateTransaction(data.transactionId || data.authority || data.orderId, {
            status: 'success',
            refId: data.refId,
            verifiedAt: new Date().toISOString()
        });
        
        App.showToast(`✅ پرداخت با موفقیت انجام شد! کد رهگیری: ${data.refId}`, 'success');
        
        // ارسال رویداد
        App.emit('payment:verified', data);
        
        // هدایت به صفحه موفقیت
        setTimeout(() => {
            if (window.location.pathname.includes('payment')) {
                window.location.href = '/';
            }
        }, 2000);
    },
    
    // ===== خطا در تأیید =====
    onVerificationFailed: function(message) {
        App.showToast(`❌ ${message}`, 'error');
        
        // ارسال رویداد
        App.emit('payment:failed', { message });
        
        // هدایت به صفحه خطا
        setTimeout(() => {
            if (window.location.pathname.includes('payment')) {
                window.location.href = '/';
            }
        }, 2000);
    },
    
    // ===== نمایش مودال نتیجه پرداخت =====
    showResultModal: function(success, data) {
        const modal = document.createElement('div');
        modal.id = 'paymentResultModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-sm">
                <div class="modal-header">
                    <h3>${success ? '✅ نتیجه پرداخت' : '❌ خطا در پرداخت'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body text-center">
                    ${success ? `
                        <div class="success-icon">🎉</div>
                        <p>پرداخت با موفقیت انجام شد</p>
                        <p><small>کد رهگیری: ${data.refId}</small></p>
                        <p><small>مبلغ: ${this.formatPrice(data.amount)}</small></p>
                    ` : `
                        <div class="error-icon">😞</div>
                        <p>${data.message || 'پرداخت ناموفق بود'}</p>
                        <p><small>لطفاً دوباره تلاش کنید</small></p>
                    `}
                    <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">تأیید</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PaymentVerification.init();
});

window.PaymentVerification = PaymentVerification;
