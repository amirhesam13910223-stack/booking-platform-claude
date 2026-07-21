 /* ============================================
   DATE-HELPER.JS - توابع کمکی تاریخ
   ============================================ */

const DateHelper = {
    // ===== تبدیل تاریخ میلادی به شمسی =====
    toPersianDate: function(date) {
        const d = new Date(date);
        const persianDate = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        }).format(d);
        
        return persianDate;
    },
    
    // ===== تبدیل تاریخ میلادی به شمسی (فرمت کوتاه) =====
    toPersianDateShort: function(date) {
        const d = new Date(date);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(d);
    },
    
    // ===== دریافت ساعت از تاریخ =====
    getTimeFromDate: function(date) {
        const d = new Date(date);
        return d.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // ===== فرمت تاریخ برای نمایش =====
    formatDate: function(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    },
    
    // ===== بررسی اعتبار تاریخ =====
    isValidDate: function(date) {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    },
    
    // ===== محاسبه تفاوت روز بین دو تاریخ =====
    daysDifference: function(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    
    // ===== محاسبه تفاوت ساعت بین دو تاریخ =====
    hoursDifference: function(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60));
    },
    
    // ===== افزودن روز به تاریخ =====
    addDays: function(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },
    
    // ===== افزودن ماه به تاریخ =====
    addMonths: function(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    },
    
    // ===== افزودن سال به تاریخ =====
    addYears: function(date, years) {
        const result = new Date(date);
        result.setFullYear(result.getFullYear() + years);
        return result;
    },
    
    // ===== گرفتن نام روز هفته =====
    getWeekdayName: function(date, lang = 'fa') {
        const d = new Date(date);
        const weekdays = {
            fa: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
            en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        };
        return weekdays[lang][d.getDay()];
    },
    
    // ===== گرفتن نام ماه =====
    getMonthName: function(date, lang = 'fa') {
        const d = new Date(date);
        const months = {
            fa: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
            en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        };
        return months[lang][d.getMonth()];
    },
    
    // ===== بررسی اینکه آیا تاریخ امروز است =====
    isToday: function(date) {
        const today = new Date();
        const d = new Date(date);
        return d.toDateString() === today.toDateString();
    },
    
    // ===== بررسی اینکه آیا تاریخ در آینده است =====
    isFuture: function(date) {
        const d = new Date(date);
        return d > new Date();
    },
    
    // ===== بررسی اینکه آیا تاریخ در گذشته است =====
    isPast: function(date) {
        const d = new Date(date);
        return d < new Date();
    },
    
    // ===== دریافت بازه زمانی (امروز، این هفته، این ماه) =====
    getDateRange: function(range) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch(range) {
            case 'today':
                return { start: today, end: today };
            case 'tomorrow':
                const tomorrow = this.addDays(today, 1);
                return { start: tomorrow, end: tomorrow };
            case 'yesterday':
                const yesterday = this.addDays(today, -1);
                return { start: yesterday, end: yesterday };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = this.addDays(weekStart, 6);
                return { start: weekStart, end: weekEnd };
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { start: monthStart, end: monthEnd };
            default:
                return { start: today, end: today };
        }
    },
    
    // ===== دریافت تمام روزهای یک بازه =====
    getDaysInRange: function(startDate, endDate) {
        const days = [];
        let current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return days;
    },
    
    // ===== دریافت سن از تاریخ تولد =====
    getAge: function(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    },
    
    // ===== تبدیل تاریخ به timestamp =====
    toTimestamp: function(date) {
        return new Date(date).getTime();
    },
    
    // ===== تبدیل timestamp به تاریخ =====
    fromTimestamp: function(timestamp) {
        return new Date(timestamp);
    },
    
    // ===== دریافت زمان نسبی (پیش‌تر، بعداً) =====
    getRelativeTime: function(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);
        
        if (years > 0) return `${years} سال پیش`;
        if (months > 0) return `${months} ماه پیش`;
        if (days > 0) return `${days} روز پیش`;
        if (hours > 0) return `${hours} ساعت پیش`;
        if (minutes > 0) return `${minutes} دقیقه پیش`;
        if (seconds > 10) return `${seconds} ثانیه پیش`;
        return 'لحظاتی پیش';
    }
};

window.DateHelper = DateHelper;
