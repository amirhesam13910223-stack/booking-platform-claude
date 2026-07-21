 /* ============================================
   PAYMENT.CONFIG.JS - تنظیمات درگاه‌های پرداخت
   ============================================ */

const PaymentConfig = {
    // درگاه پیش‌فرض
    defaultGateway: 'zarinpal',
    
    // تنظیمات درگاه‌ها
    gateways: {
        zarinpal: {
            name: 'زرین‌پال',
            icon: '🏦',
            merchantId: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
            callbackUrl: '/payment/callback',
            sandbox: true,
            sandboxUrl: 'https://sandbox.zarinpal.com/pg/StartPay/',
            productionUrl: 'https://www.zarinpal.com/pg/StartPay/',
            enabled: true
        },
        idpay: {
            name: 'آیدی‌پی',
            icon: '💳',
            apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            callbackUrl: '/payment/callback',
            sandbox: true,
            sandboxUrl: 'https://sandbox.idpay.ir/payment/',
            productionUrl: 'https://idpay.ir/payment/',
            enabled: true
        },
        nextpay: {
            name: 'نکست‌پی',
            icon: '⚡',
            apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            callbackUrl: '/payment/callback',
            sandbox: true,
            sandboxUrl: 'https://sandbox.nextpay.org/payment/',
            productionUrl: 'https://nextpay.org/payment/',
            enabled: true
        },
        payir: {
            name: 'پی.آی آر',
            icon: '🔷',
            apiKey: 'xxxxxxxxxxxxxxxxxxxx',
            callbackUrl: '/payment/callback',
            sandbox: true,
            sandboxUrl: 'https://sandbox.pay.ir/payment/',
            productionUrl: 'https://pay.ir/payment/',
            enabled: true
        },
        zibal: {
            name: 'زیبال',
            icon: '🦓',
            merchantId: 'zibal',
            callbackUrl: '/payment/callback',
            sandbox: true,
            sandboxUrl: 'https://sandbox.zibal.ir/payment/',
            productionUrl: 'https://zibal.ir/payment/',
            enabled: true
        },
        vandar: {
            name: 'وندار',
            icon: '🟣',
            apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            callbackUrl: '/payment/callback',
            sandbox: true,
            sandboxUrl: 'https://sandbox.vandar.ir/payment/',
            productionUrl: 'https://vandar.ir/payment/',
            enabled: true
        }
    },
    
    // تنظیمات بیعانه
    deposit: {
        enabled: true,
        defaultPercent: 10,
        minAmount: 10000,
        maxPercent: 50,
        refundHours: 24,
        cancellationFeePercent: 25
    },
    
    // تنظیمات کیف پول
    wallet: {
        enabled: true,
        minCharge: 10000,
        maxCharge: 5000000,
        minWithdraw: 50000,
        maxWithdraw: 10000000,
        withdrawFee: 0,
        withdrawMethod: 'bank_transfer'
    },
    
    // تنظیمات تسویه
    settlement: {
        autoSettle: true,
        settleInterval: 'monthly', // daily, weekly, monthly
        settleDay: 1,
        minSettleAmount: 100000,
        bankTransferTime: 72, // hours
        settlementFee: 0
    },
    
    // تنظیمات کارمزد
    commission: {
        defaultRate: 3,
        minCommission: 1000,
        maxCommission: 100000,
        specialRates: {},
        categoryRates: {
            beauty: 2.5,
            medical: 3.5,
            sports: 2,
            education: 2.5,
            other: 3
        }
    },
    
    // تنظیمات پرداخت کارت اعتباری
    card: {
        supportedBanks: [
            'melli', 'mellat', 'saderat', 'tejarat', 'sepah',
            'refah', 'keshavarzi', 'mashen', 'postbank', 'tosee'
        ],
        installmentEnabled: false,
        maxInstallments: 12,
        installmentInterestRate: 0
    },
    
    // تنظیمات درگاه تست
    test: {
        enabled: true,
        cardNumber: '5022291060000000',
        cvv2: '123',
        expireDate: '12/25',
        staticAmount: 100000
    },
    
    // پیام‌های پرداخت
    messages: {
        success: 'پرداخت با موفقیت انجام شد',
        failed: 'پرداخت ناموفق بود',
        pending: 'پرداخت در حال بررسی',
        refunded: 'وجه به حساب شما بازگشت داده شد',
        expired: 'زمان پرداخت به پایان رسید'
    }
};

// در دسترس قرار دادن
window.PaymentConfig = PaymentConfig;
