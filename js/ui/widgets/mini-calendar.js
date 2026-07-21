 /* ============================================
   MINI-CALENDAR.JS - تقویم کوچک تعاملی
   ============================================ */

const MiniCalendar = {
    // تاریخ فعلی
    currentDate: new Date(),
    
    // تاریخ انتخاب شده
    selectedDate: null,
    
    // روزهای هفته
    weekdays: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
    
    // نام ماه‌ها
    monthNames: [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ],
    
    // ===== ایجاد تقویم =====
    create: function(container, options = {}) {
        const {
            onDateSelect = null,
            minDate = null,
            maxDate = null,
            highlightDates = [],
            disabledDates = [],
            showWeekNumbers = false,
            firstDayOfWeek = 6 // شنبه
        } = options;
        
        this.container = container;
        this.onDateSelect = onDateSelect;
        this.minDate = minDate ? new Date(minDate) : null;
        this.maxDate = maxDate ? new Date(maxDate) : null;
        this.highlightDates = highlightDates.map(d => new Date(d).toDateString());
        this.disabledDates = disabledDates.map(d => new Date(d).toDateString());
        this.firstDayOfWeek = firstDayOfWeek;
        
        this.render();
        this.attachEvents();
        
        return this;
    },
    
    // ===== رندر تقویم =====
    render: function() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const startDay = firstDayOfMonth.getDay();
        const daysInMonth = lastDayOfMonth.getDate();
        
        // تنظیم روز اول هفته (شنبه = 6)
        let offset = (startDay - this.firstDayOfWeek + 7) % 7;
        
        const calendarHTML = `
            <div class="mini-calendar">
                <div class="calendar-header">
                    <button class="calendar-nav prev-month" aria-label="ماه قبل">◀</button>
                    <div class="calendar-month-year">
                        <span class="month">${this.monthNames[month]}</span>
                        <span class="year">${year}</span>
                    </div>
                    <button class="calendar-nav next-month" aria-label="ماه بعد">▶</button>
                </div>
                <div class="calendar-weekdays">
                    ${this.weekdays.map(day => `<div class="weekday">${day}</div>`).join('')}
                </div>
                <div class="calendar-days" id="calendar-days"></div>
            </div>
        `;
        
        this.container.innerHTML = calendarHTML;
        
        // رندر روزها
        const daysContainer = document.getElementById('calendar-days');
        const daysHTML = [];
        
        // روزهای ماه قبل
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = offset - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            daysHTML.push(`<div class="calendar-day other-month" data-date="${year}-${month}-${day}">${day}</div>`);
        }
        
        // روزهای ماه جاری
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = date.toDateString();
            const isToday = this.isToday(date);
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
            const isHighlighted = this.highlightDates.includes(dateStr);
            const isDisabled = this.isDisabled(date);
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (isHighlighted) classes += ' highlighted';
            if (isDisabled) classes += ' disabled';
            
            daysHTML.push(`<div class="${classes}" data-date="${year}-${month + 1}-${i}" data-timestamp="${date.getTime()}">${i}</div>`);
        }
        
        // روزهای ماه بعد
        const remainingDays = 42 - (offset + daysInMonth);
        for (let i = 1; i <= remainingDays; i++) {
            daysHTML.push(`<div class="calendar-day other-month" data-date="${year}-${month + 2}-${i}">${i}</div>`);
        }
        
        daysContainer.innerHTML = daysHTML.join('');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        this.container.querySelector('.prev-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
            this.attachEvents();
        });
        
        this.container.querySelector('.next-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
            this.attachEvents();
        });
        
        this.container.querySelectorAll('.calendar-day:not(.other-month):not(.disabled)').forEach(day => {
            day.addEventListener('click', (e) => {
                const dateStr = day.dataset.date;
                const timestamp = parseInt(day.dataset.timestamp);
                const selectedDate = new Date(timestamp);
                
                this.selectedDate = selectedDate;
                
                // به‌روزرسانی کلاس انتخاب
                this.container.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
                day.classList.add('selected');
                
                if (this.onDateSelect) {
                    this.onDateSelect(selectedDate);
                }
            });
        });
    },
    
    // ===== بررسی امروز بودن =====
    isToday: function(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    },
    
    // ===== بررسی غیرفعال بودن =====
    isDisabled: function(date) {
        const dateStr = date.toDateString();
        
        if (this.disabledDates.includes(dateStr)) return true;
        
        if (this.minDate && date < this.minDate) return true;
        if (this.maxDate && date > this.maxDate) return true;
        
        return false;
    },
    
    // ===== رفتن به تاریخ مشخص =====
    gotoDate: function(date) {
        this.currentDate = new Date(date);
        this.selectedDate = new Date(date);
        this.render();
        this.attachEvents();
    },
    
    // ===== دریافت تاریخ انتخاب شده =====
    getSelectedDate: function() {
        return this.selectedDate;
    },
    
    // ===== تنظیم تاریخ‌های هایلایت =====
    setHighlightDates: function(dates) {
        this.highlightDates = dates.map(d => new Date(d).toDateString());
        this.render();
        this.attachEvents();
    }
};

// استایل‌های تقویم کوچک
const miniCalendarStyles = `
<style>
.mini-calendar {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    padding: 1rem;
    width: 100%;
    max-width: 350px;
}
.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}
.calendar-nav {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
}
.calendar-nav:hover {
    background: var(--bg-secondary);
}
.calendar-month-year {
    font-weight: bold;
    font-size: 1rem;
}
.calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    margin-bottom: 0.5rem;
}
.weekday {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    padding: 0.25rem;
}
.calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
}
.calendar-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
}
.calendar-day:hover:not(.other-month):not(.disabled) {
    background: var(--color-primary-soft);
}
.calendar-day.today {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: bold;
}
.calendar-day.selected {
    background: var(--color-primary);
    color: white;
}
.calendar-day.highlighted {
    background: var(--color-success-soft);
    color: var(--color-success);
}
.calendar-day.other-month {
    color: var(--text-tertiary);
    opacity: 0.5;
}
.calendar-day.disabled {
    color: var(--text-tertiary);
    cursor: not-allowed;
    opacity: 0.5;
}
</style>
`;

if (!document.querySelector('#mini-calendar-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'mini-calendar-styles';
    styleSheet.textContent = miniCalendarStyles;
    document.head.appendChild(styleSheet);
}

window.MiniCalendar = MiniCalendar;
