 /* ============================================
   VANDAR.JS - درگاه پرداخت وندار
   ============================================ */

const VandarGateway = {
    // تنظیمات اختصاصی
    config: {
        apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        sandbox: true,
        sandboxUrl: 'https://sandbox.vandar.ir/payment/',
        productionUrl: 'https://vandar.ir/payment/'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadConfig();
        console.log('🟣 درگاه وندار راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: function() {
        const saved = localStorage.getItem('vandar_config');
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
        
        const token = 'VND' + Date.now() + Math.random().toString(36).substr(2, 16);
        const paymentUrl = `${this.getBaseUrl()}${token}`;
        
        const paymentData = {
            token: token,
            amount: amount,
            description: description,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(`vandar_${token}`, JSON.stringify(paymentData));
        
        return {
            success: true,
            token: token,
            paymentUrl: paymentUrl
        };
    },
    
    // ===== تأیید پرداخت =====
    verifyPayment: async function(token, amount) {
        await this.delay(800);
        
        const savedData = localStorage.getItem(`vandar_${token}`);
        
        if (!savedData) {
            return { success: false, message: 'تراکنش یافت نشد' };
        }
        
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
            const refId = 'VDR' + Date.now() + Math.floor(Math.random() * 1000000);
            
            const transaction = {
                token: token,
                refId: refId,
                amount: amount,
                status: 'success',
                verifiedAt: new Date().toISOString()
            };
            
            localStorage.setItem(`vandar_${token}`, JSON.stringify(transaction));
            
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
        localStorage.setItem('vandar_config', JSON.stringify({ sandbox: enabled }));
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    VandarGateway.init();
});

window.VandarGateway = VandarGateway;
