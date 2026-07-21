 /* ============================================
   ZARINPAL.JS - درگاه پرداخت زرین‌پال
   ============================================ */

const ZarinpalGateway = {
    // تنظیمات اختصاصی
    config: {
        merchantId: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
        sandbox: true,
        sandboxUrl: 'https://sandbox.zarinpal.com/pg/StartPay/',
        productionUrl: 'https://www.zarinpal.com/pg/StartPay/'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadConfig();
        console.log('🏦 درگاه زرین‌پال راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: function() {
        const saved = localStorage.getItem('zarinpal_config');
        if (saved) {
            try {
                this.config = { ...this.config, ...JSON.parse(saved) };
            } catch(e) {}
        }
    },
    
    // ===== درخواست پرداخت =====
    requestPayment: async function(data) {
        const { amount, description, callbackUrl, mobile, email } = data;
        
        // شبیه‌سازی درخواست به API زرین‌پال
        await this.delay(800);
        
        // تولید Authority
        const authority = 'ZP' + Date.now() + Math.random().toString(36).substr(2, 16);
        
        // آدرس بازگشت
        const paymentUrl = `${this.getBaseUrl()}${authority}`;
        
        // ذخیره اطلاعات
        const paymentData = {
            authority: authority,
            amount: amount,
            description: description,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(`zarinpal_${authority}`, JSON.stringify(paymentData));
        
        return {
            success: true,
            authority: authority,
            paymentUrl: paymentUrl
        };
    },
    
    // ===== تأیید پرداخت =====
    verifyPayment: async function(authority, amount) {
        await this.delay(800);
        
        const savedData = localStorage.getItem(`zarinpal_${authority}`);
        
        if (!savedData) {
            return { success: false, message: 'تراکنش یافت نشد' };
        }
        
        // شبیه‌سازی تأیید موفق
        const isSuccess = Math.random() > 0.1; // 90%成功率
        
        if (isSuccess) {
            const refId = 'ZP' + Date.now() + Math.floor(Math.random() * 1000000);
            
            const transaction = {
                authority: authority,
                refId: refId,
                amount: amount,
                status: 'success',
                verifiedAt: new Date().toISOString()
            };
            
            localStorage.setItem(`zarinpal_${authority}`, JSON.stringify(transaction));
            
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
        localStorage.setItem('zarinpal_config', JSON.stringify({ sandbox: enabled }));
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ZarinpalGateway.init();
});

window.ZarinpalGateway = ZarinpalGateway;
