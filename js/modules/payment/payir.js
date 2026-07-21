 /* ============================================
   PAYIR.JS - درگاه پرداخت پی.آی آر
   ============================================ */

const PayirGateway = {
    // تنظیمات اختصاصی
    config: {
        apiKey: 'xxxxxxxxxxxxxxxxxxxx',
        sandbox: true,
        sandboxUrl: 'https://sandbox.pay.ir/payment/',
        productionUrl: 'https://pay.ir/payment/'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadConfig();
        console.log('🔷 درگاه پی.آی آر راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: function() {
        const saved = localStorage.getItem('payir_config');
        if (saved) {
            try {
                this.config = { ...this.config, ...JSON.parse(saved) };
            } catch(e) {}
        }
    },
    
    // ===== درخواست پرداخت =====
    requestPayment: async function(data) {
        const { amount, description, callbackUrl, mobile, email } = data;
        
        await this.delay(800);
        
        const factorNumber = 'PAY' + Date.now() + Math.floor(Math.random() * 10000);
        const paymentUrl = `${this.getBaseUrl()}${factorNumber}`;
        
        const paymentData = {
            factorNumber: factorNumber,
            amount: amount,
            description: description,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(`payir_${factorNumber}`, JSON.stringify(paymentData));
        
        return {
            success: true,
            factorNumber: factorNumber,
            paymentUrl: paymentUrl
        };
    },
    
    // ===== تأیید پرداخت =====
    verifyPayment: async function(factorNumber, amount) {
        await this.delay(800);
        
        const savedData = localStorage.getItem(`payir_${factorNumber}`);
        
        if (!savedData) {
            return { success: false, message: 'تراکنش یافت نشد' };
        }
        
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
            const transId = 'PIR' + Date.now() + Math.floor(Math.random() * 1000000);
            
            const transaction = {
                factorNumber: factorNumber,
                transId: transId,
                amount: amount,
                status: 'success',
                verifiedAt: new Date().toISOString()
            };
            
            localStorage.setItem(`payir_${factorNumber}`, JSON.stringify(transaction));
            
            return {
                success: true,
                transId: transId,
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
        localStorage.setItem('payir_config', JSON.stringify({ sandbox: enabled }));
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PayirGateway.init();
});

window.PayirGateway = PayirGateway;
