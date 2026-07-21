 /* ============================================
   NEXTPAY.JS - درگاه پرداخت نکست‌پی
   ============================================ */

const NextpayGateway = {
    // تنظیمات اختصاصی
    config: {
        apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        sandbox: true,
        sandboxUrl: 'https://sandbox.nextpay.org/payment/',
        productionUrl: 'https://nextpay.org/payment/'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadConfig();
        console.log('⚡ درگاه نکست‌پی راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: function() {
        const saved = localStorage.getItem('nextpay_config');
        if (saved) {
            try {
                this.config = { ...this.config, ...JSON.parse(saved) };
            } catch(e) {}
        }
    },
    
    // ===== درخواست پرداخت =====
    requestPayment: async function(data) {
        const { amount, description, callbackUrl, customerName, customerPhone } = data;
        
        await this.delay(800);
        
        const transId = 'NX' + Date.now() + Math.floor(Math.random() * 10000);
        const paymentUrl = `${this.getBaseUrl()}${transId}`;
        
        const paymentData = {
            transId: transId,
            amount: amount,
            description: description,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(`nextpay_${transId}`, JSON.stringify(paymentData));
        
        return {
            success: true,
            transId: transId,
            paymentUrl: paymentUrl
        };
    },
    
    // ===== تأیید پرداخت =====
    verifyPayment: async function(transId, amount) {
        await this.delay(800);
        
        const savedData = localStorage.getItem(`nextpay_${transId}`);
        
        if (!savedData) {
            return { success: false, message: 'تراکنش یافت نشد' };
        }
        
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
            const refId = 'NXP' + Date.now() + Math.floor(Math.random() * 1000000);
            
            const transaction = {
                transId: transId,
                refId: refId,
                amount: amount,
                status: 'success',
                verifiedAt: new Date().toISOString()
            };
            
            localStorage.setItem(`nextpay_${transId}`, JSON.stringify(transaction));
            
            return {
                success: true,
                refId: refId,
                message: 'پرداخت با موفقیت انجام شد'
            };
        } else {
            return {
                success: false,
                message: 'پرداخت ناموفق بود'
            };
        }
    },
    
    // ===== دریافت آدرس پایه =====
    getBaseUrl: function() {
        return this.config.sandbox ? this.config.sandboxUrl : this.config.productionUrl;
    },
    
    // ===== تنظیم حالت تست =====
    setSandbox: function(enabled) {
        this.config.sandbox = enabled;
        localStorage.setItem('nextpay_config', JSON.stringify({ sandbox: enabled }));
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    NextpayGateway.init();
});

window.NextpayGateway = NextpayGateway;
