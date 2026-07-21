 /* ============================================
   ZIBAL.JS - درگاه پرداخت زیبال
   ============================================ */

const ZibalGateway = {
    // تنظیمات اختصاصی
    config: {
        merchantId: 'zibal',
        sandbox: true,
        sandboxUrl: 'https://sandbox.zibal.ir/payment/',
        productionUrl: 'https://zibal.ir/payment/'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadConfig();
        console.log('🦓 درگاه زیبال راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: function() {
        const saved = localStorage.getItem('zibal_config');
        if (saved) {
            try {
                this.config = { ...this.config, ...JSON.parse(saved) };
            } catch(e) {}
        }
    },
    
    // ===== درخواست پرداخت =====
    requestPayment: async function(data) {
        const { amount, description, callbackUrl, mobile } = data;
        
        await this.delay(800);
        
        const trackId = 'ZBL' + Date.now() + Math.floor(Math.random() * 10000);
        const paymentUrl = `${this.getBaseUrl()}${trackId}`;
        
        const paymentData = {
            trackId: trackId,
            amount: amount,
            description: description,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(`zibal_${trackId}`, JSON.stringify(paymentData));
        
        return {
            success: true,
            trackId: trackId,
            paymentUrl: paymentUrl
        };
    },
    
    // ===== تأیید پرداخت =====
    verifyPayment: async function(trackId, amount) {
        await this.delay(800);
        
        const savedData = localStorage.getItem(`zibal_${trackId}`);
        
        if (!savedData) {
            return { success: false, message: 'تراکنش یافت نشد' };
        }
        
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
            const refNumber = 'ZBL' + Date.now() + Math.floor(Math.random() * 1000000);
            
            const transaction = {
                trackId: trackId,
                refNumber: refNumber,
                amount: amount,
                status: 'success',
                verifiedAt: new Date().toISOString()
            };
            
            localStorage.setItem(`zibal_${trackId}`, JSON.stringify(transaction));
            
            return {
                success: true,
                refNumber: refNumber,
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
        localStorage.setItem('zibal_config', JSON.stringify({ sandbox: enabled }));
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ZibalGateway.init();
});

window.ZibalGateway = ZibalGateway;
