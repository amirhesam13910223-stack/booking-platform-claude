/* ============================================
   SCHEDULE-MANAGER.JS - مدیریت زمانبندی
   ============================================ */

   const ScheduleManager = {
    // زمانبندی کسب‌وکار
    schedule: {
        defaultWorkHours: {
            start: '09:00',
            end: '20:00'
        },
        breakTimes: [],
        customHours: {}
    },
    
    // کسب‌وکار فعلی
    businessId: null,
    
    // روزهای هفته به فارسی
    weekdays: {
        saturday: 'شنبه',
        sunday: 'یکشنبه',
        monday: 'دوشنبه',
        tuesday: 'سه‌شنبه',
        wednesday: 'چهارشنبه',
        thursday: 'پنجشنبه',
        friday: 'جمعه'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadSchedule();
        this.attachEvents();
        console.log('📅 ماژول مدیریت زمانبندی راه‌اندازی شد');
    },
    
    // ===== بارگذاری زمانبندی =====
    loadSchedule: function() {
        const user = AuthSession.getUser();
        if (!user || user.role !== 'business') return;
        
        this.businessId = user.id;
        const saved = localStorage.getItem(`schedule_${this.businessId}`);
        if (saved) {
            try {
                this.schedule = JSON.parse(saved);
            } catch(e) {}
        }
        
        // تنظیمات پیش‌فرض
        if (!this.schedule.breakTimes) {
            this.schedule.breakTimes = [
                {
                    id: 'BRK001',
                    name: 'استراحت ناهار',
                    start: '13:00',
                    end: '14:00',
                    active: true
                }
            ];
        }
        
        if (!this.schedule.customHours) {
            this.schedule.customHours = {};
            for (const day of Object.keys(this.weekdays)) {
                this.schedule.customHours[day] = {
                    start: this.schedule.defaultWorkHours.start,
                    end: this.schedule.defaultWorkHours.end,
                    active: true
                };
            }
            // تعطیلی جمعه
            this.schedule.customHours.friday.active = false;
        }
        
        this.saveSchedule();
    },
    
    // ===== ذخیره زمانبندی =====
    saveSchedule: function() {
        if (this.businessId) {
            localStorage.setItem(`schedule_${this.businessId}`, JSON.stringify(this.schedule));
        }
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('schedule:update', (data) => {
            this.updateSchedule(data);
        });
        
        App.on('schedule:add-break', (data) => {
            this.addBreakTime(data);
        });
        
        App.on('schedule:remove-break', (data) => {
            this.removeBreakTime(data.breakId);
        });
    },
    
    // ===== به‌روزرسانی زمانبندی =====
    updateSchedule: function(updates) {
        this.schedule = { ...this.schedule, ...updates };
        this.saveSchedule();
        App.showToast('زمانبندی با موفقیت به‌روزرسانی شد', 'success');
        App.emit('schedule:updated', this.schedule);
    },
    
    // ===== افزودن زمان استراحت =====
    addBreakTime: function(breakData) {
        const newBreak = {
            id: 'BRK' + Date.now() + Math.floor(Math.random() * 1000),
            ...breakData,
            active: true
        };
        
        this.schedule.breakTimes.push(newBreak);
        this.saveSchedule();
        App.showToast('زمان استراحت اضافه شد', 'success');
        App.emit('schedule:break-added', newBreak);
        
        return newBreak;
    },
    
    // ===== حذف زمان استراحت =====
    removeBreakTime: function(breakId) {
        const index = this.schedule.breakTimes.findIndex(b => b.id === breakId);
        if (index !== -1) {
            const removed = this.schedule.breakTimes[index];
            this.schedule.breakTimes.splice(index, 1);
            this.saveSchedule();
            App.showToast('زمان استراحت حذف شد', 'info');
            App.emit('schedule:break-removed', removed);
            return true;
        }
        return false;
    },
    
    // ===== بررسی زمان کاری =====
    isWorkingTime: function(date, time) {
        const dayName = this.getDayName(date);
        const daySchedule = this.schedule.customHours[dayName];
        
        if (!daySchedule || !daySchedule.active) return false;
        
        // بررسی محدوده کاری
        if (time < daySchedule.start || time > daySchedule.end) return false;
        
        // بررسی زمان استراحت
        for (const breakTime of this.schedule.breakTimes) {
            if (!breakTime.active) continue;
            if (time >= breakTime.start && time < breakTime.end) return false;
        }
        
        return true;
    },
    
    // ===== دریافت ساعات کاری یک روز =====
    getWorkingHoursForDay: function(date) {
        const dayName = this.getDayName(date);
        const daySchedule = this.schedule.customHours[dayName];
        
        if (!daySchedule || !daySchedule.active) {
            return { start: null, end: null, active: false };
        }
        
        return {
            start: daySchedule.start,
            end: daySchedule.end,
            active: true,
            breaks: this.schedule.breakTimes.filter(b => b.active)
        };
    },
    
    // ===== دریافت نام روز به انگلیسی =====
    getDayName: function(date) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const d = new Date(date);
        return days[d.getDay()];
    },
    
    // ===== دریافت ساعات آزاد یک روز =====
    getAvailableTimeSlots: function(date, duration = 30) {
        const workingHours = this.getWorkingHoursForDay(date);
        if (!workingHours.active) return [];
        
        const slots = [];
        let current = this.timeToMinutes(workingHours.start);
        const end = this.timeToMinutes(workingHours.end);
        
        // حذف زمان‌های استراحت
        const breakRanges = workingHours.breaks.map(b => ({
            start: this.timeToMinutes(b.start),
            end: this.timeToMinutes(b.end)
        }));
        
        while (current + duration <= end) {
            let isBreak = false;
            for (const br of breakRanges) {
                if (current >= br.start && current < br.end) {
                    isBreak = true;
                    current = br.end;
                    break;
                }
            }
            
            if (!isBreak) {
                slots.push(this.minutesToTime(current));
                current += duration;
            }
        }
        
        return slots;
    },
    
    // ===== نمایش مودال مدیریت زمانبندی =====
    showScheduleModal: function() {
        const modal = document.createElement('div');
        modal.id = 'scheduleModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>📅 مدیریت زمانبندی</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="schedule-tabs">
                        <button class="tab-btn active" data-tab="workhours">ساعات کاری</button>
                        <button class="tab-btn" data-tab="breaks">زمان استراحت</button>
                    </div>
                    
                    <div id="workhoursTab" class="tab-content active">
                        <h4>ساعات کاری روزهای هفته</h4>
                        <div class="workhours-grid">
                            ${Object.entries(this.weekdays).map(([key, name]) => `
                                <div class="workhour-row" data-day="${key}">
                                    <div class="day-name">${name}</div>
                                    <div class="day-hours">
                                        <input type="time" id="start_${key}" class="time-input" value="${this.schedule.customHours[key]?.start || '09:00'}" ${!this.schedule.customHours[key]?.active ? 'disabled' : ''}>
                                        <span>تا</span>
                                        <input type="time" id="end_${key}" class="time-input" value="${this.schedule.customHours[key]?.end || '20:00'}" ${!this.schedule.customHours[key]?.active ? 'disabled' : ''}>
                                    </div>
                                    <label class="day-active">
                                        <input type="checkbox" class="day-active-checkbox" data-day="${key}" ${this.schedule.customHours[key]?.active !== false ? 'checked' : ''}>
                                        فعال
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn btn-primary" id="saveWorkhoursBtn">ذخیره ساعات کاری</button>
                    </div>
                    
                    <div id="breaksTab" class="tab-content">
                        <h4>زمان‌های استراحت</h4>
                        <button class="btn btn-outline btn-small" id="addBreakBtn">➕ افزودن زمان استراحت</button>
                        <div class="breaks-list" id="breaksList">
                            ${this.renderBreaksList()}
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // تب‌ها
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`${tab}Tab`).classList.add('active');
            });
        });
        
        // ذخیره ساعات کاری
        document.getElementById('saveWorkhoursBtn')?.addEventListener('click', () => {
            for (const [key] of Object.entries(this.weekdays)) {
                const start = document.getElementById(`start_${key}`)?.value;
                const end = document.getElementById(`end_${key}`)?.value;
                const activeCheckbox = document.querySelector(`.day-active-checkbox[data-day="${key}"]`);
                const active = activeCheckbox?.checked || false;
                
                if (!this.schedule.customHours[key]) {
                    this.schedule.customHours[key] = {};
                }
                this.schedule.customHours[key].start = start;
                this.schedule.customHours[key].end = end;
                this.schedule.customHours[key].active = active;
            }
            this.saveSchedule();
            App.showToast('ساعات کاری ذخیره شد', 'success');
        });
        
        // افزودن زمان استراحت
        document.getElementById('addBreakBtn')?.addEventListener('click', () => {
            this.showAddBreakForm();
            modal.remove();
        });
        
        // حذف زمان استراحت
        document.querySelectorAll('.delete-break').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const breakId = e.target.dataset.id;
                if (confirm('آیا از حذف این زمان استراحت مطمئن هستید؟')) {
                    this.removeBreakTime(breakId);
                    modal.remove();
                    setTimeout(() => this.showScheduleModal(), 100);
                }
            });
        });
    },
    
    // ===== رندر لیست زمان‌های استراحت =====
    renderBreaksList: function() {
        if (this.schedule.breakTimes.length === 0) {
            return '<div class="empty-state">هیچ زمان استراحتی ثبت نشده است</div>';
        }
        
        return this.schedule.breakTimes.map(breakTime => `
            <div class="break-item">
                <div class="break-info">
                    <strong>${breakTime.name}</strong>
                    <span>${breakTime.start} - ${breakTime.end}</span>
                </div>
                <button class="icon-btn delete-break" data-id="${breakTime.id}" title="حذف">🗑️</button>
            </div>
        `).join('');
    },
    
    // ===== نمایش فرم افزودن زمان استراحت =====
    showAddBreakForm: function() {
        const modal = document.createElement('div');
        modal.id = 'addBreakFormModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>➕ افزودن زمان استراحت</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addBreakForm">
                        <div class="form-group">
                            <label>عنوان</label>
                            <input type="text" id="breakName" class="form-control" placeholder="مثال: استراحت ناهار" required>
                        </div>
                        <div class="form-group">
                            <label>ساعت شروع</label>
                            <input type="time" id="breakStart" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>ساعت پایان</label>
                            <input type="time" id="breakEnd" class="form-control" required>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                            <button type="submit" class="btn btn-primary">افزودن</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('addBreakForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const breakData = {
                name: document.getElementById('breakName')?.value,
                start: document.getElementById('breakStart')?.value,
                end: document.getElementById('breakEnd')?.value
            };
            
            if (breakData.name && breakData.start && breakData.end) {
                this.addBreakTime(breakData);
                modal.remove();
                setTimeout(() => this.showScheduleModal(), 100);
            } else {
                App.showToast('لطفاً تمام فیلدها را پر کنید', 'error');
            }
        });
    },
    
    // ===== تبدیل ساعت به دقیقه =====
    timeToMinutes: function(time) {
        if (!time) return 0;
        const [hours, minutes] = time.split(':');
        return parseInt(hours) * 60 + parseInt(minutes);
    },
    
    // ===== تبدیل دقیقه به ساعت =====
    minutesToTime: function(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
};

// استایل‌های مدیریت زمانبندی
const scheduleStyles = `
<style>
.schedule-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
}

.tab-btn {
    padding: 8px 16px;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
}

.tab-btn.active {
    background: var(--color-primary);
    color: white;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

.workhours-grid {
    margin: 20px 0;
}

.workhour-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid var(--border-color);
    flex-wrap: wrap;
    gap: 10px;
}

.day-name {
    font-weight: bold;
    width: 100px;
}

.day-hours {
    display: flex;
    align-items: center;
    gap: 10px;
}

.time-input {
    padding: 6px 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--input-bg);
    color: var(--text-primary);
}

.day-active {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
}

.breaks-list {
    margin-top: 20px;
}

.break-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    margin-bottom: 10px;
}

.break-info {
    display: flex;
    gap: 15px;
    align-items: center;
}

@media (max-width: 768px) {
    .workhour-row {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .break-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }
}
</style>
`;

if (!document.querySelector('#schedule-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'schedule-styles';
    styleSheet.textContent = scheduleStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    ScheduleManager.init();
});

window.ScheduleManager = ScheduleManager; 
