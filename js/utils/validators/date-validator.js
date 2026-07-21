/* ============================================
   DATE-VALIDATOR.JS - اعتبارسنجی تاریخ
   ============================================ */

   const DateValidator = {
    // ===== اعتبارسنجی تاریخ میلادی =====
    isValidGregorian: function(year, month, day) {
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && 
               date.getMonth() === month - 1 && 
               date.getDate() === day;
    },
    
    // ===== اعتبارسنجی تاریخ شمسی =====
    isValidPersian: function(year, month, day) {
        if (year < 1300 || year > 1500) return false;
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        
        // روزهای ماه‌های شمسی
        const persianMonthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
        
        // روزهای ماه اسفند در سال کبیسه
        let lastMonthDays = 29;
        if (this.isPersianLeapYear(year)) {
            lastMonthDays = 30;
        }
        persianMonthDays[11] = lastMonthDays;
        
        return day <= persianMonthDays[month - 1];
    },
    
    // ===== بررسی سال کبیسه شمسی =====
    isPersianLeapYear: function(year) {
        const remainders = [1, 5, 9, 13, 17, 22, 26, 30];
        const remainder = (year - 1348) % 33;
        return remainders.includes(remainder);
    },
    
    // ===== اعتبارسنجی رشته تاریخ =====
    isValidDateString: function(dateString, format = 'YYYY-MM-DD') {
        if (!dateString) return false;
        
        if (format === 'YYYY-MM-DD') {
            const parts = dateString.split('-');
            if (parts.length !== 3) return false;
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            return this.isValidGregorian(year, month, day);
        }
        
        if (format === 'YYYY/MM/DD') {
            const parts = dateString.split('/');
            if (parts.length !== 3) return false;
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            return this.isValidGregorian(year, month, day);
        }
        
        return false;
    },
    
    // ===== اعتبارسنجی زمان =====
    isValidTime: function(time) {
        if (!time) return false;
        const pattern = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
        if (!pattern.test(time)) return false;
        
        const [hours, minutes] = time.split(':');
        return parseInt(hours) >= 0 && parseInt(hours) <= 23 && 
               parseInt(minutes) >= 0 && parseInt(minutes) <= 59;
    },
    
    // ===== اعتبارسنجی تاریخ و زمان =====
    isValidDateTime: function(date, time) {
        return this.isValidDateString(date) && this.isValidTime(time);
    },
    
    // ===== بررسی تاریخ در آینده =====
    isFutureDate: function(date) {
        if (!this.isValidDateString(date)) return false;
        const inputDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate > today;
    },
    
    // ===== بررسی تاریخ در گذشته =====
    isPastDate: function(date) {
        if (!this.isValidDateString(date)) return false;
        const inputDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate < today;
    },
    
    // ===== بررسی تاریخ امروز =====
    isToday: function(date) {
        if (!this.isValidDateString(date)) return false;
        const inputDate = new Date(date);
        const today = new Date();
        return inputDate.toDateString() === today.toDateString();
    },
    
    // ===== بررسی محدوده تاریخ =====
    isInRange: function(date, startDate, endDate) {
        if (!this.isValidDateString(date) || 
            !this.isValidDateString(startDate) || 
            !this.isValidDateString(endDate)) {
            return false;
        }
        
        const d = new Date(date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return d >= start && d <= end;
    },
    
    // ===== بررسی زمان در محدوده =====
    isTimeInRange: function(time, startTime, endTime) {
        if (!this.isValidTime(time) || !this.isValidTime(startTime) || !this.isValidTime(endTime)) {
            return false;
        }
        
        return time >= startTime && time <= endTime;
    },
    
    // ===== پیام خطا =====
    getDateErrorMessage: function(date) {
        if (!date) return 'تاریخ نمی‌تواند خالی باشد';
        if (!this.isValidDateString(date)) return 'فرمت تاریخ معتبر نیست (YYYY-MM-DD)';
        return null;
    },
    
    getTimeErrorMessage: function(time) {
        if (!time) return 'ساعت نمی‌تواند خالی باشد';
        if (!this.isValidTime(time)) return 'فرمت ساعت معتبر نیست (HH:MM)';
        return null;
    }
};

window.DateValidator = DateValidator; 
