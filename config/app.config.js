 /* ============================================
   APP.CONFIG.JS - تنظیمات اصلی برنامه
   ============================================ */

const AppConfig = {
    // نسخه برنامه
    version: '1.0.0',
    
    // محیط اجرا (development, production, staging)
    environment: 'production',
    
    // تنظیمات برنامه
    app: {
        name: 'پلتفرم نوبت‌دهی هوشمند',
        shortName: 'نوبت‌دهی',
        description: 'ساده‌ترین راه برای رزرو نوبت آنلاین',
        keywords: 'رزرو آنلاین, نوبت دهی, کسب و کار, آرایشگاه, پزشک, مشاور',
        author: 'Booking Platform',
        email: 'info@booking-platform.ir',
        phone: '021-12345678',
        address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
        timezone: 'Asia/Tehran',
        locale: 'fa-IR'
    },
    
    // تنظیمات UI
    ui: {
        theme: 'light', // light, dark, auto
        direction: 'rtl',
        animations: true,
        notifications: true,
        sound: true,
        language: 'fa',
        defaultTheme: 'light',
        availableThemes: ['light', 'dark', 'blue', 'green'],
        availableLanguages: ['fa', 'en']
    },
    
    // تنظیمات API
    api: {
        baseURL: '/api',
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000,
        cacheTime: 300, // seconds
        withCredentials: false
    },
    
    // تنظیمات نوبت
    booking: {
        minAdvanceHours: 1,
        maxAdvanceDays: 30,
        minDuration: 15, // minutes
        maxDuration: 240, // minutes
        cancellationFeePercent: 25,
        freeCancellationHours: 24,
        reminderHours: [24, 2],
        maxGroupSize: 20,
        maxRecurringCount: 12
    },
    
    // تنظیمات تخفیف
    discount: {
        maxPercent: 30,
        minPurchase: 50000,
        couponLength: 8,
        couponExpiryDays: 30,
        referralBonus: 50000,
        referralDiscountPercent: 10
    },
    
    // تنظیمات پرداخت
    payment: {
        defaultGateway: 'zarinpal',
        minAmount: 1000,
        maxAmount: 100000000,
        commissionRate: 3,
        minCommission: 1000,
        maxCommission: 100000,
        walletMinCharge: 10000,
        walletMaxCharge: 5000000
    },
    
    // تنظیمات امنیت
    security: {
        sessionTimeout: 7200, // seconds
        maxLoginAttempts: 5,
        blockDuration: 300, // seconds
        passwordMinLength: 6,
        passwordRequireUppercase: false,
        passwordRequireNumbers: true,
        mfaRequired: false,
        csrfProtection: true,
        rateLimit: {
            windowMs: 60000,
            maxRequests: 60
        }
    },
    
    // تنظیمات کش
    cache: {
        defaultTTL: 3600, // seconds
        maxSize: 100,
        cleanupInterval: 300 // seconds
    },
    
    // تنظیمات PWA
    pwa: {
        enabled: true,
        cacheName: 'booking-platform-v1',
        offlinePage: '/offline.html',
        precacheAssets: [
            '/',
            '/index.html',
            '/offline.html',
            '/manifest.json',
            '/css/core/reset.css',
            '/css/core/variables.css',
            '/css/core/typography.css',
            '/css/themes/light-theme.css'
        ]
    },
    
    // تنظیمات تحلیل
    analytics: {
        enabled: true,
        provider: 'self',
        trackEvents: true,
        trackPageViews: true
    },
    
    // تنظیمات پشتیبانی
    support: {
        email: 'support@booking-platform.ir',
        phone: '021-12345678',
        workingHours: {
            start: '09:00',
            end: '18:00',
            days: 'saturday_to_wednesday'
        }
    },
    
    // ویژگی‌های برنامه
    features: {
        reverseMarket: true,
        groupBooking: true,
        loyaltyProgram: true,
        referralProgram: true,
        recurringBooking: true,
        waitingList: true,
        pwa: true,
        darkMode: true,
        multiLanguage: true
    },
    
    // تنظیمات اجتماعی
    social: {
        instagram: 'https://instagram.com/bookingplatform',
        telegram: 'https://t.me/bookingplatform',
        twitter: 'https://twitter.com/bookingplatform',
        linkedin: 'https://linkedin.com/company/bookingplatform'
    },
    
    // تنظیمات SEO
    seo: {
        siteUrl: 'https://booking-platform.ir',
        siteName: 'پلتفرم نوبت‌دهی هوشمند',
        twitterCard: 'summary_large_image',
        defaultImage: '/assets/images/og-image.jpg'
    }
};

// در دسترس قرار دادن
window.AppConfig = AppConfig;
