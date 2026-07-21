 /* ============================================
   API.CONFIG.JS - تنظیمات API
   ============================================ */

const APIConfig = {
    // آدرس پایه API
    baseURL: '/api',
    
    // نسخه API
    version: 'v1',
    
    // هدرهای پیش‌فرض
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    
    // زمان timeout (میلی‌ثانیه)
    timeout: 30000,
    
    // تعداد تلاش مجدد
    retryCount: 3,
    
    // تاخیر بین تلاش‌ها (میلی‌ثانیه)
    retryDelay: 1000,
    
    // با credentials
    withCredentials: false,
    
    // مسیرهای API
    endpoints: {
        // احراز هویت
        auth: {
            login: '/auth/login',
            register: '/auth/register',
            logout: '/auth/logout',
            refresh: '/auth/refresh',
            forgotPassword: '/auth/forgot-password',
            resetPassword: '/auth/reset-password',
            verifyPhone: '/auth/verify-phone',
            me: '/auth/me'
        },
        
        // کاربران
        users: {
            list: '/users',
            get: '/users/:id',
            update: '/users/:id',
            delete: '/users/:id',
            changeRole: '/users/:id/role',
            block: '/users/:id/block',
            unblock: '/users/:id/unblock'
        },
        
        // کسب‌وکارها
        businesses: {
            list: '/businesses',
            get: '/businesses/:id',
            create: '/businesses',
            update: '/businesses/:id',
            delete: '/businesses/:id',
            verify: '/businesses/:id/verify',
            reject: '/businesses/:id/reject',
            stats: '/businesses/:id/stats'
        },
        
        // نوبت‌ها
        bookings: {
            list: '/bookings',
            get: '/bookings/:id',
            create: '/bookings',
            update: '/bookings/:id',
            cancel: '/bookings/:id/cancel',
            reschedule: '/bookings/:id/reschedule',
            confirm: '/bookings/:id/confirm'
        },
        
        // خدمات
        services: {
            list: '/services',
            get: '/services/:id',
            create: '/services',
            update: '/services/:id',
            delete: '/services/:id'
        },
        
        // پرداخت
        payment: {
            request: '/payment/request',
            verify: '/payment/verify',
            callback: '/payment/callback',
            refund: '/payment/refund',
            wallet: {
                balance: '/payment/wallet/balance',
                charge: '/payment/wallet/charge',
                withdraw: '/payment/wallet/withdraw',
                transactions: '/payment/wallet/transactions'
            }
        },
        
        // تخفیف
        discount: {
            validate: '/discount/validate',
            apply: '/discount/apply',
            coupons: '/discount/coupons',
            coupon: '/discount/coupons/:code'
        },
        
        // بازار معکوس
        reverseMarket: {
            requests: '/reverse-market/requests',
            request: '/reverse-market/requests/:id',
            bids: '/reverse-market/requests/:id/bids',
            placeBid: '/reverse-market/requests/:id/bids',
            winner: '/reverse-market/requests/:id/winner'
        },
        
        // گزارشات
        reports: {
            bookings: '/reports/bookings',
            revenue: '/reports/revenue',
            customers: '/reports/customers',
            export: '/reports/export'
        },
        
        // تنظیمات سیستم
        settings: {
            get: '/settings',
            update: '/settings',
            public: '/settings/public'
        },
        
        // آمار
        stats: {
            platform: '/stats/platform',
            business: '/stats/business',
            user: '/stats/user'
        }
    },
    
    // پیام‌های خطای API
    errorMessages: {
        '400': 'درخواست نامعتبر',
        '401': 'لطفاً وارد حساب کاربری خود شوید',
        '403': 'شما دسترسی به این بخش را ندارید',
        '404': 'منبع مورد نظر یافت نشد',
        '408': 'زمان درخواست به پایان رسید',
        '409': 'تداخل در داده‌ها',
        '422': 'اطلاعات وارد شده معتبر نیست',
        '429': 'تعداد درخواست‌های شما بیش از حد مجاز است',
        '500': 'خطای داخلی سرور',
        '502': 'درگاه نامعتبر',
        '503': 'سرویس در دسترس نیست',
        '504': 'زمان پاسخگویی سرور به پایان رسید'
    },
    
    // کدهای وضعیت موفقیت
    successStatusCodes: [200, 201, 202, 204],
    
    // اینترسپتورهای درخواست
    requestInterceptors: [
        (config) => {
            // افزودن توکن
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        }
    ],
    
    // اینترسپتورهای پاسخ
    responseInterceptors: [
        (response) => {
            return response.data;
        }
    ],
    
    // اینترسپتورهای خطا
    errorInterceptors: [
        (error) => {
            if (error.response?.status === 401) {
                // پاک کردن توکن و هدایت به لاگین
                localStorage.removeItem('auth_token');
                sessionStorage.removeItem('auth_token');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    ]
};

// در دسترس قرار دادن
window.APIConfig = APIConfig;
