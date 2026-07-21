 /* ============================================
   CONSTANTS.JS - ثابت‌های سراسری برنامه
   ============================================ */

const Constants = {
    // ===== ثابت‌های عمومی =====
    APP_NAME: 'پلتفرم نوبت‌دهی هوشمند',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'ساده‌ترین راه برای رزرو نوبت آنلاین',
    
    // ===== وضعیت‌های نوبت =====
    BOOKING_STATUS: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        RESCHEDULED: 'rescheduled'
    },
    
    // ===== وضعیت‌های کاربر =====
    USER_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        BLOCKED: 'blocked',
        PENDING: 'pending'
    },
    
    // ===== نقش‌های کاربر =====
    USER_ROLES: {
        USER: 'user',
        BUSINESS: 'business',
        ADMIN: 'admin',
        SUPER_ADMIN: 'super_admin'
    },
    
    // ===== وضعیت‌های کسب‌وکار =====
    BUSINESS_STATUS: {
        PENDING: 'pending',
        VERIFIED: 'verified',
        REJECTED: 'rejected',
        SUSPENDED: 'suspended'
    },
    
    // ===== وضعیت‌های پرداخت =====
    PAYMENT_STATUS: {
        PENDING: 'pending',
        SUCCESS: 'success',
        FAILED: 'failed',
        REFUNDED: 'refunded',
        EXPIRED: 'expired'
    },
    
    // ===== نوع‌های تراکنش =====
    TRANSACTION_TYPES: {
        CHARGE: 'charge',
        WITHDRAW: 'withdraw',
        BOOKING: 'booking',
        REFUND: 'refund',
        DEPOSIT: 'deposit'
    },
    
    // ===== نوع‌های تخفیف =====
    DISCOUNT_TYPES: {
        PERCENTAGE: 'percentage',
        FIXED: 'fixed',
        COUPON: 'coupon',
        REFERRAL: 'referral',
        LOYALTY: 'loyalty',
        GROUP: 'group',
        SEASONAL: 'seasonal'
    },
    
    // ===== سطوح وفاداری =====
    LOYALTY_TIERS: {
        BRONZE: { name: 'برنزی', minPoints: 0, discount: 5, icon: '🥉' },
        SILVER: { name: 'نقره‌ای', minPoints: 100, discount: 10, icon: '🥈' },
        GOLD: { name: 'طلایی', minPoints: 300, discount: 15, icon: '🥇' },
        PLATINUM: { name: 'پلاتینیوم', minPoints: 600, discount: 20, icon: '💎' },
        DIAMOND: { name: 'الماس', minPoints: 1000, discount: 25, icon: '💎✨' }
    },
    
    // ===== روزهای هفته =====
    WEEKDAYS: {
        SATURDAY: 'saturday',
        SUNDAY: 'sunday',
        MONDAY: 'monday',
        TUESDAY: 'tuesday',
        WEDNESDAY: 'wednesday',
        THURSDAY: 'thursday',
        FRIDAY: 'friday'
    },
    
    WEEKDAY_NAMES: {
        saturday: 'شنبه',
        sunday: 'یکشنبه',
        monday: 'دوشنبه',
        tuesday: 'سه‌شنبه',
        wednesday: 'چهارشنبه',
        thursday: 'پنجشنبه',
        friday: 'جمعه'
    },
    
    // ===== نام ماه‌ها =====
    MONTH_NAMES: [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ],
    
    // ===== الگوهای اعتبارسنجی =====
    VALIDATION_PATTERNS: {
        PHONE: /^09[0-9]{9}$/,
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        NATIONAL_CODE: /^\d{10}$/,
        IBAN: /^IR\d{24}$/,
        CARD_NUMBER: /^\d{16}$/,
        PASSWORD: /^.{6,}$/,
        URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    },
    
    // ===== پیام‌های خطای اعتبارسنجی =====
    VALIDATION_MESSAGES: {
        REQUIRED: 'این فیلد الزامی است',
        EMAIL: 'ایمیل معتبر نیست',
        PHONE: 'شماره تماس معتبر نیست',
        NATIONAL_CODE: 'کد ملی معتبر نیست',
        MIN_LENGTH: 'حداقل {length} کاراکتر وارد کنید',
        MAX_LENGTH: 'حداکثر {length} کاراکتر وارد کنید',
        MIN: 'مقدار باید حداقل {min} باشد',
        MAX: 'مقدار باید حداکثر {max} باشد',
        NUMERIC: 'مقدار باید عدد باشد',
        POSITIVE: 'مقدار باید مثبت باشد',
        MATCH: 'مقدار با فیلد مورد نظر مطابقت ندارد'
    },
    
    // ===== کلیدهای localStorage =====
    STORAGE_KEYS: {
        AUTH_TOKEN: 'auth_token',
        USER: 'user',
        THEME: 'theme',
        LANGUAGE: 'language',
        CART: 'cart',
        FAVORITES: 'favorites',
        RECENT_BOOKINGS: 'recent_bookings',
        NOTIFICATIONS: 'notifications',
        PUSH_SUBSCRIPTION: 'push_subscription'
    },
    
    // ===== رویدادهای سیستم =====
    SYSTEM_EVENTS: {
        APP_READY: 'app:ready',
        APP_ERROR: 'app:error',
        AUTH_LOGIN: 'auth:login',
        AUTH_LOGOUT: 'auth:logout',
        AUTH_CHECKED: 'auth:checked',
        BOOKING_CREATED: 'booking:created',
        BOOKING_CANCELLED: 'booking:cancelled',
        BOOKING_UPDATED: 'booking:updated',
        PAYMENT_SUCCESS: 'payment:success',
        PAYMENT_FAILED: 'payment:failed',
        DISCOUNT_APPLIED: 'discount:applied',
        THEME_CHANGED: 'theme:changed',
        NETWORK_ONLINE: 'network:online',
        NETWORK_OFFLINE: 'network:offline'
    },
    
    // ===== انواع اعلان =====
    NOTIFICATION_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
        BOOKING: 'booking',
        PAYMENT: 'payment',
        DISCOUNT: 'discount'
    },
    
    // ===== واحدهای پول =====
    CURRENCY: {
        CODE: 'IRR',
        SYMBOL: 'تومان',
        DECIMALS: 0,
        THOUSANDS_SEPARATOR: ',',
        DECIMAL_SEPARATOR: '.'
    },
    
    // ===== محدودیت‌ها =====
    LIMITS: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        MAX_BOOKINGS_PER_DAY: 10,
        MAX_BOOKINGS_PER_BUSINESS: 50,
        MAX_COUPON_USAGE: 100,
        MAX_REFERRAL_REWARDS: 50,
        MAX_WAITING_LIST_SIZE: 100
    },
    
    // ===== تنظیمات تاریخ و زمان =====
    DATE_FORMATS: {
        DATE: 'YYYY-MM-DD',
        TIME: 'HH:mm',
        DATE_TIME: 'YYYY-MM-DD HH:mm',
        PERSIAN_DATE: 'jYYYY-jMM-jDD',
        PERSIAN_DATE_TIME: 'jYYYY-jMM-jDD HH:mm'
    },
    
    // ===== اپراتورهای تلفن همراه =====
    MOBILE_OPERATORS: {
        '0910': 'همراه اول',
        '0911': 'همراه اول',
        '0912': 'همراه اول',
        '0913': 'همراه اول',
        '0914': 'همراه اول',
        '0915': 'همراه اول',
        '0916': 'همراه اول',
        '0917': 'همراه اول',
        '0918': 'همراه اول',
        '0919': 'همراه اول',
        '0930': 'ایرانسل',
        '0933': 'ایرانسل',
        '0935': 'ایرانسل',
        '0936': 'ایرانسل',
        '0937': 'ایرانسل',
        '0938': 'ایرانسل',
        '0939': 'ایرانسل',
        '0920': 'رایتل',
        '0921': 'رایتل',
        '0922': 'رایتل',
        '0990': 'آپتا',
        '0991': 'آپتا',
        '0992': 'آپتا',
        '0993': 'آپتا',
        '0994': 'آپتا'
    }
};

// در دسترس قرار دادن
window.Constants = Constants;
