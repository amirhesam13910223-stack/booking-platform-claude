/* ============================================
   GATEWAY-HANDLER.JS - مدیریت درگاه‌های پرداخت
   ============================================ */

   const PaymentGatewayHandler = {
    // درگاه‌های فعال
    activeGateways: [],
    
    // درگاه پیش‌فرض
    defaultGateway: 'zarinpal',
    
    // تنظیمات درگاه‌ها
    gatewaysConfig: {
        zarinpal: {
            name: 'زرین‌پال',
            icon: '🏦',
            merchantId: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
            callbackUrl: window.location.origin + '/payment/callback',
            enabled: true
        },
        idpay: {
            name: 'آیدی‌پی',
            icon: '💳',
            apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            callbackUrl: window.location.origin + '/payment/callback',
            sandbox: true,
            enabled: true
        },
        nextpay: {
            name: 'نکست‌پی',
            icon: '⚡',
            apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            callbackUrl: window.location.origin + '/payment/callback',
            enabled: true
        },
        payir: {
            name: 'پی.آی آر',
            icon: '🔷',
            apiKey: 'xxxxxxxxxxxxxxxxxxxx',
            callbackUrl: window.location.origin + '/payment/callback',
            enabled: true
        },
        zibal: {
            name: 'زیبال',
            icon: '🦓',
            merchantId: 'zibal',
            callbackUrl: window.location.origin + '/payment/callback',
            enabled: true
        },
        vandar: {
            name: 'وندار',
            icon: '🟣',
            apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            callbackUrl: window.location.origin + '/payment/callback',
            enabled: true
        }
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadActiveGateways();
        this.attachEvents();
        console.log('💳 ماژول PaymentGatewayHandler راه‌اندازی شد');
    },
    
    // ===== بارگذاری درگاه‌های فعال =====
    loadActiveGateways: function() {
        this.activeGateways = Object.entries(this.gatewaysConfig)
            .filter(([_, config]) => config.enabled)
            .map(([key, config]) => ({ id: key, ...config }));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('payment:request', (data) => {
            this.processPayment(data);
        });
    },
    
    // ===== پردازش پرداخت =====
    processPayment: async function(data) {
        const { amount, description, callback, gateway = this.defaultGateway, deposit = false } = data;
        
        if (!amount || amount <= 0) {
            App.showToast('مبلغ نامعتبر است', 'error');
            return false;
        }
        
        // بررسی درگاه
        const gatewayConfig = this.gatewaysConfig[gateway];
        if (!gatewayConfig || !gatewayConfig.enabled) {
            App.showToast('درگاه پرداخت مورد نظر فعال نیست', 'error');
            return false;
        }
        
        App.showToast(`در حال اتصال به درگاه ${gatewayConfig.name}...`, 'info');
        
        try {
            // ایجاد تراکنش
            const transaction = await this.createTransaction({
                amount: amount,
                description: description,
                gateway: gateway,
                deposit: deposit,
                callback: callback
            });
            
            if (transaction && transaction.paymentUrl) {
                // ذخیره اطلاعات تراکنش
                this.saveTransaction(transaction);
                
                // هدایت به درگاه پرداخت
                if (callback) {
                    callback(transaction);
                } else {
                    window.location.href = transaction.paymentUrl;
                }
                
                return transaction;
            } else {
                throw new Error('خطا در ایجاد تراکنش');
            }
        } catch (error) {
            console.error('خطا در پردازش پرداخت:', error);
            App.showToast('خطا در اتصال به درگاه پرداخت', 'error');
            return false;
        }
    },
    
    // ===== ایجاد تراکنش =====
    createTransaction: async function(data) {
        // شبیه‌سازی درخواست به سرور
        await this.delay(1000);
        
        const transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 10000);
        const paymentUrl = `https://sandbox.${data.gateway}.ir/payment/${transactionId}`;
        
        return {
            id: transactionId,
            amount: data.amount,
            description: data.description,
            gateway: data.gateway,
            deposit: data.deposit,
            status: 'pending',
            createdAt: new Date().toISOString(),
            paymentUrl: paymentUrl
        };
    },
    
    // ===== ذخیره تراکنش =====
    saveTransaction: function(transaction) {
        const transactions = JSON.parse(localStorage.getItem('payment_transactions') || '[]');
        transactions.unshift(transaction);
        localStorage.setItem('payment_transactions', JSON.stringify(transactions));
        
        App.emit('payment:transaction-created', transaction);
    },
    
    // ===== دریافت تراکنش =====
    getTransaction: function(transactionId) {
        const transactions = JSON.parse(localStorage.getItem('payment_transactions') || '[]');
        return transactions.find(t => t.id === transactionId);
    },
    
    // ===== به‌روزرسانی تراکنش =====
    updateTransaction: function(transactionId, updates) {
        const transactions = JSON.parse(localStorage.getItem('payment_transactions') || '[]');
        const index = transactions.findIndex(t => t.id === transactionId);
        
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates };
            localStorage.setItem('payment_transactions', JSON.stringify(transactions));
            App.emit('payment:transaction-updated', transactions[index]);
            return transactions[index];
        }
        
        return null;
    },
    
    // ===== دریافت لیست درگاه‌ها =====
    getGateways: function() {
        return this.activeGateways;
    },
    
    // ===== تغییر درگاه پیش‌فرض =====
    setDefaultGateway: function(gatewayId) {
        if (this.gatewaysConfig[gatewayId] && this.gatewaysConfig[gatewayId].enabled) {
            this.defaultGateway = gatewayId;
            localStorage.setItem('default_payment_gateway', gatewayId);
            App.showToast(`درگاه پیش‌فرض به ${this.gatewaysConfig[gatewayId].name} تغییر کرد`, 'success');
            return true;
        }
        return false;
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PaymentGatewayHandler.init();
});

window.PaymentGatewayHandler = PaymentGatewayHandler; 
