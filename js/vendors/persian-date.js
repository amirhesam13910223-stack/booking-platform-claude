 /* ============================================
   PERSIAN-DATE.JS - کتابخانه تاریخ شمسی
   ============================================ */

class PersianDate {
    constructor(date = null) {
        if (date) {
            if (date instanceof Date) {
                this.gregorianDate = date;
            } else if (typeof date === 'string') {
                this.gregorianDate = new Date(date);
            } else if (typeof date === 'number') {
                this.gregorianDate = new Date(date);
            } else {
                this.gregorianDate = new Date();
            }
        } else {
            this.gregorianDate = new Date();
        }
        
        this.persianDate = this.toPersian(this.gregorianDate);
    }
    
    // ===== تبدیل میلادی به شمسی =====
    toPersian(gregorianDate) {
        const year = gregorianDate.getFullYear();
        const month = gregorianDate.getMonth();
        const day = gregorianDate.getDate();
        
        // الگوریتم تبدیل (ساده شده)
        const gregorianDays = this.gregorianToJDN(year, month + 1, day);
        const persian = this.jdnToPersian(gregorianDays);
        
        return {
            year: persian.year,
            month: persian.month,
            day: persian.day
        };
    }
    
    // ===== تبدیل به JDN =====
    gregorianToJDN(year, month, day) {
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    }
    
    // ===== تبدیل JDN به شمسی =====
    jdnToPersian(jdn) {
        const jdnPersian = jdn - 2121446;
        const year = Math.floor((jdnPersian * 4 + 3) / 146097);
        const jdnYear = jdnPersian - Math.floor((146097 * year + 3) / 4);
        const month = Math.floor((jdnYear * 100 + 99) / 3059);
        const day = jdnYear - Math.floor((3059 * month + 2) / 100) + 1;
        
        return { year: year + 1, month: month, day: day };
    }
    
    // ===== دریافت سال =====
    getFullYear() {
        return this.persianDate.year;
    }
    
    // ===== دریافت ماه =====
    getMonth() {
        return this.persianDate.month;
    }
    
    // ===== دریافت روز =====
    getDate() {
        return this.persianDate.day;
    }
    
    // ===== دریافت روز هفته =====
    getDay() {
        return this.gregorianDate.getDay();
    }
    
    // ===== دریافت ساعت =====
    getHours() {
        return this.gregorianDate.getHours();
    }
    
    // ===== دریافت دقیقه =====
    getMinutes() {
        return this.gregorianDate.getMinutes();
    }
    
    // ===== دریافت ثانیه =====
    getSeconds() {
        return this.gregorianDate.getSeconds();
    }
    
    // ===== فرمت تاریخ =====
    format(formatString = 'YYYY/MM/DD') {
        const year = this.persianDate.year;
        const month = this.persianDate.month.toString().padStart(2, '0');
        const day = this.persianDate.day.toString().padStart(2, '0');
        
        return formatString
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }
    
    // ===== فرمت کامل =====
    formatLong() {
        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        const weekdayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
        
        return `${weekdayNames[this.getDay()]} ${this.persianDate.day} ${monthNames[this.persianDate.month - 1]} ${this.persianDate.year}`;
    }
    
    // ===== افزودن روز =====
    addDays(days) {
        const newDate = new Date(this.gregorianDate);
        newDate.setDate(newDate.getDate() + days);
        return new PersianDate(newDate);
    }
    
    // ===== افزودن ماه =====
    addMonths(months) {
        const newDate = new Date(this.gregorianDate);
        newDate.setMonth(newDate.getMonth() + months);
        return new PersianDate(newDate);
    }
    
    // ===== افزودن سال =====
    addYears(years) {
        const newDate = new Date(this.gregorianDate);
        newDate.setFullYear(newDate.getFullYear() + years);
        return new PersianDate(newDate);
    }
    
    // ===== تفاوت با تاریخ دیگر =====
    diff(otherDate, unit = 'day') {
        const diffMs = this.gregorianDate - otherDate.gregorianDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (unit === 'day') return diffDays;
        if (unit === 'month') return Math.floor(diffDays / 30);
        if (unit === 'year') return Math.floor(diffDays / 365);
        return diffDays;
    }
    
    // ===== بررسی کبیسه =====
    isLeapYear() {
        const year = this.persianDate.year;
        const remainders = [1, 5, 9, 13, 17, 22, 26, 30];
        const remainder = (year - 1348) % 33;
        return remainders.includes(remainder);
    }
    
    // ===== شروع ماه =====
    startOfMonth() {
        return new PersianDate(new Date(this.gregorianDate.getFullYear(), this.gregorianDate.getMonth(), 1));
    }
    
    // ===== پایان ماه =====
    endOfMonth() {
        return new PersianDate(new Date(this.gregorianDate.getFullYear(), this.gregorianDate.getMonth() + 1, 0));
    }
    
    // ===== شروع سال =====
    startOfYear() {
        return new PersianDate(new Date(this.gregorianDate.getFullYear(), 0, 1));
    }
    
    // ===== پایان سال =====
    endOfYear() {
        return new PersianDate(new Date(this.gregorianDate.getFullYear(), 11, 31));
    }
    
    // ===== به میلادی =====
    toGregorian() {
        return this.gregorianDate;
    }
    
    // ===== به تایم‌استمپ =====
    toTimestamp() {
        return this.gregorianDate.getTime();
    }
    
    // ===== مقایسه =====
    isAfter(otherDate) {
        return this.gregorianDate > otherDate.gregorianDate;
    }
    
    isBefore(otherDate) {
        return this.gregorianDate < otherDate.gregorianDate;
    }
    
    isEqual(otherDate) {
        return this.gregorianDate.getTime() === otherDate.gregorianDate.getTime();
    }
    
    // ===== استاتیک: امروز =====
    static today() {
        return new PersianDate();
    }
    
    // ===== استاتیک: از تایم‌استمپ =====
    static fromTimestamp(timestamp) {
        return new PersianDate(timestamp);
    }
    
    // ===== استاتیک: از تاریخ شمسی =====
    static fromPersian(year, month, day) {
        // تبدیل شمسی به میلادی (ساده شده)
        const jdn = this.persianToJDN(year, month, day);
        const gregorian = this.jdnToGregorian(jdn);
        return new PersianDate(new Date(gregorian.year, gregorian.month - 1, gregorian.day));
    }
    
    static persianToJDN(year, month, day) {
        const epbase = year - 474;
        const epyear = 474 + (epbase % 2820);
        const m = (month - 1);
        const jdn = day + Math.floor((m * 31 + 30) / 6) + 365 * (epyear - 1) + Math.floor(epyear / 4) - Math.floor(epyear / 100) + Math.floor(epyear / 400) + 2121445;
        return jdn;
    }
    
    static jdnToGregorian(jdn) {
        const a = jdn + 32044;
        const b = Math.floor((4 * a + 3) / 146097);
        const c = a - Math.floor((146097 * b) / 4);
        const d = Math.floor((4 * c + 3) / 1461);
        const e = c - Math.floor((1461 * d) / 4);
        const m = Math.floor((5 * e + 2) / 153);
        const day = e - Math.floor((153 * m + 2) / 5) + 1;
        const month = m + 3 - 12 * Math.floor(m / 10);
        const year = 100 * b + d - 4800 + Math.floor(m / 10);
        return { year, month, day };
    }
}

// در دسترس قرار دادن
window.PersianDate = PersianDate;
