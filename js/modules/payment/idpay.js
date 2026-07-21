 /* ============================================
   IDPAY.JS - درگاه پرداخت آیدی‌پی
   ============================================ */

const IDpayGateway = {
    // تنظیمات اختصاصی
    config: {
        apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        sandbox: true,
        sandboxUrl: 'https://sandbox.idpay.ir/payment/',
        productionUrl: 'https://idpay.ir/payment/'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadConfig();
        console.log('💳 درگاه آیدی‌پی راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: function() {
        const saved = localStorage.getItem('idpay_config');
        if (saved) {
            try {
                this.config = { ...this.config, ...JSON.parse(saved) };
            } catch(e) {}
        }
    },
    
    // ===== درخواست پرداخت =====
    requestPayment: async function(data) {
        const { amount, description, callbackUrl, name, phone, mail } = data;
        
        await this.delay(800);
        
        const orderId = 'ID' + Date.now() + Math.floor(Math.random() * 10000);
        const paymentUrl = `${this.getBaseUrl()}${orderId}`;
        
        const paymentData = {
            orderId: orderId,
            amount: amount,
            description: description,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(`idpay_${orderId}`, JSON.stringify(paymentData));
        
        return {
            success: true,
            orderId: orderId,
            paymentUrl: paymentUrl
        };
    },
    
    // ===== تأیید پرداخت =====
    verifyPayment: async function(orderId, amount) {
        await this.delay(800);
        
        const savedData = localStorage.getItem(`idpay_${orderId}`);
        
        if (!savedData) {
            return { success: false, message: 'تراکنش یافت نشد' };
        }
        
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
            const trackId = 'IDP' + Date.now() + Math.floor(Math.random() * 1000000);
            
            const transaction = {
                orderId: orderId,
                trackId: trackId,
                amount: amount,
                status: 'success',
                verifiedAt: new Date().toISOString()
            };
            
            localStorage.setItem(`idpay_${orderId}`, JSON.stringify(transaction));
            
            return {
                success: true,
                trackId: trackId,
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
        localStorage.setItem('idpay_config', JSON.stringify({ sandbox: enabled }));
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    IDpayGateway.init();
});

window.IDpayGateway = IDpayGateway;
