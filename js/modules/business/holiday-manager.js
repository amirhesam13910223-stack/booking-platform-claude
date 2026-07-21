 /* ============================================
   HOLIDAY-MANAGER.JS - مدیریت تعطیلات
   ============================================ */

const HolidayManager = {
    // لیست تعطیلات
    holidays: [],
    
    // کسب‌وکار فعلی
    businessId: null,
    
    // تعطیلات رسمی ایران
    publicHolidays: [
        { month: 1, day: 1, name: 'نوروز' },
        { month: 1, day: 2, name: 'نوروز' },
        { month: 1, day: 3, name: 'نوروز' },
        { month: 1, day: 4, name: 'نوروز' },
        { month: 1, day: 12, name: 'روز جمهوری اسلامی' },
        { month: 1, day: 13, name: 'سیزده بدر' },
        { month: 2, day: 14, name: 'رحلت امام خمینی' },
        { month: 2, day: 15, name: 'قیام ۱۵ خرداد' },
        { month: 3, day: 10, name: 'عید فطر' },
        { month: 4, day: 24, name: 'عید قربان' },
        { month: 4, day: 25, name: 'عید غدیر' },
        { month: 6, day: 4, name: 'تاسوعا' },
        { month: 6, day: 5, name: 'عاشورا' },
        { month: 6, day: 25, name: 'اربعین' },
        { month: 7, day: 14, name: 'رحلت پیامبر' },
        { month: 7, day: 15, name: 'شهادت امام حسن مجتبی' },
        { month: 8, day: 21, name: 'ولادت پیامبر' },
        { month: 9, day: 29, name: '۲۲ بهمن' }
    ],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadHolidays();
        this.attachEvents();
        console.log('📅 ماژول مدیریت تعطیلات راه‌اندازی شد');
    },
    
    // ===== بارگذاری لیست تعطیلات =====
    loadHolidays: function() {
        const user = AuthSession.getUser();
        if (!user || user.role !== 'business') return;
        
        this.businessId = user.id;
        const saved = localStorage.getItem(`holidays_${this.businessId}`);
        if (saved) {
            try {
                this.holidays = JSON.parse(saved);
            } catch(e) {}
        }
        
        if (this.holidays.length === 0) {
            this.holidays = [
                {
                    id: 'HOL001',
                    name: 'تعطیلات نوروز',
                    startDate: '2024-03-20',
                    endDate: '2024-04-02',
                    type: 'annual',
                    active: true,
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveHolidays();
        }
    },
    
    // ===== ذخیره لیست تعطیلات =====
    saveHolidays: function() {
        if (this.businessId) {
            localStorage.setItem(`holidays_${this.businessId}`, JSON.stringify(this.holidays));
        }
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('holiday:add', (data) => {
            this.addHoliday(data);
        });
        
        App.on('holiday:remove', (data) => {
            this.removeHoliday(data.holidayId);
        });
        
        App.on('holiday:update', (data) => {
            this.updateHoliday(data);
        });
    },
    
    // ===== افزودن تعطیل جدید =====
    addHoliday: function(holidayData) {
        const newHoliday = {
            id: 'HOL' + Date.now() + Math.floor(Math.random() * 1000),
            ...holidayData,
            active: true,
            createdAt: new Date().toISOString()
        };
        
        this.holidays.push(newHoliday);
        this.saveHolidays();
        
        App.showToast(`تعطیل ${newHoliday.name} با موفقیت اضافه شد`, 'success');
        App.emit('holiday:added', newHoliday);
        
        return newHoliday;
    },
    
    // ===== حذف تعطیل =====
    removeHoliday: function(holidayId) {
        const index = this.holidays.findIndex(h => h.id === holidayId);
        if (index !== -1) {
            const removed = this.holidays[index];
            this.holidays.splice(index, 1);
            this.saveHolidays();
            App.showToast(`تعطیل ${removed.name} حذف شد`, 'info');
            App.emit('holiday:removed', removed);
            return true;
        }
        return false;
    },
    
    // ===== به‌روزرسانی تعطیل =====
    updateHoliday: function(updatedData) {
        const index = this.holidays.findIndex(h => h.id === updatedData.id);
        if (index !== -1) {
            this.holidays[index] = { ...this.holidays[index], ...updatedData };
            this.saveHolidays();
            App.showToast(`تعطیل ${this.holidays[index].name} به‌روزرسانی شد`, 'success');
            App.emit('holiday:updated', this.holidays[index]);
            return true;
        }
        return false;
    },
    
    // ===== بررسی تعطیل بودن یک تاریخ =====
    isHoliday: function(date) {
        const checkDate = new Date(date);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        // بررسی تعطیلات ثبت شده
        for (const holiday of this.holidays) {
            if (!holiday.active) continue;
            if (dateStr >= holiday.startDate && dateStr <= holiday.endDate) {
                return { isHoliday: true, name: holiday.name };
            }
        }
        
        // بررسی تعطیلات رسمی
        const month = checkDate.getMonth() + 1;
        const day = checkDate.getDate();
        for (const holiday of this.publicHolidays) {
            if (holiday.month === month && holiday.day === day) {
                return { isHoliday: true, name: holiday.name };
            }
        }
        
        // بررسی جمعه
        if (checkDate.getDay() === 5) {
            return { isHoliday: true, name: 'جمعه' };
        }
        
        return { isHoliday: false, name: null };
    },
    
    // ===== دریافت تعطیلات در بازه زمانی =====
    getHolidaysInRange: function(startDate, endDate) {
        const holidays = [];
        let current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            const result = this.isHoliday(current);
            if (result.isHoliday) {
                holidays.push({
                    date: current.toISOString().split('T')[0],
                    name: result.name
                });
            }
            current.setDate(current.getDate() + 1);
        }
        
        return holidays;
    },
    
    // ===== نمایش مودال مدیریت تعطیلات =====
    showHolidayModal: function() {
        const modal = document.createElement('div');
        modal.id = 'holidayModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>📅 مدیریت تعطیلات</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="holiday-actions">
                        <button class="btn btn-primary" id="addHolidayBtn">➕ افزودن تعطیل جدید</button>
                    </div>
                    
                    <div class="holiday-list">
                        <h4>لیست تعطیلات (${this.holidays.length})</h4>
                        <div class="holiday-table">
                            <div class="table-header">
                                <span>عنوان</span>
                                <span>از تاریخ</span>
                                <span>تا تاریخ</span>
                                <span>نوع</span>
                                <span>وضعیت</span>
                                <span>عملیات</span>
                            </div>
                            ${this.holidays.map(holiday => `
                                <div class="table-row" data-holiday-id="${holiday.id}">
                                    <span><strong>${holiday.name}</strong></span>
                                    <span>${this.formatDate(holiday.startDate)}</span>
                                    <span>${this.formatDate(holiday.endDate)}</span>
                                    <span>${holiday.type === 'annual' ? 'سالانه' : 'یکباره'}</span>
                                    <span class="holiday-status ${holiday.active ? 'active' : 'inactive'}">${holiday.active ? 'فعال' : 'غیرفعال'}</span>
                                    <span>
                                        <button class="icon-btn edit-holiday" data-id="${holiday.id}">✏️</button>
                                        <button class="icon-btn toggle-holiday" data-id="${holiday.id}" title="${holiday.active ? 'غیرفعال' : 'فعال'}">${holiday.active ? '🔴' : '🟢'}</button>
                                        <button class="icon-btn delete-holiday" data-id="${holiday.id}">🗑️</button>
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="public-holidays">
                        <h4>تعطیلات رسمی ایران</h4>
                        <div class="public-holidays-list">
                            ${this.publicHolidays.slice(0, 10).map(h => `
                                <span class="public-holiday-badge">${h.name}</span>
                            `).join('')}
                            <span class="public-holiday-more">و...</span>
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('addHolidayBtn')?.addEventListener('click', () => {
            this.showAddHolidayForm();
            modal.remove();
        });
        
        document.querySelectorAll('.edit-holiday').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const holidayId = e.target.dataset.id;
                const holiday = this.holidays.find(h => h.id === holidayId);
                if (holiday) {
                    this.showEditHolidayForm(holiday);
                    modal.remove();
                }
            });
        });
        
        document.querySelectorAll('.toggle-holiday').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const holidayId = e.target.dataset.id;
                const holiday = this.holidays.find(h => h.id === holidayId);
                if (holiday) {
                    this.updateHoliday({ id: holidayId, active: !holiday.active });
                    modal.remove();
                    setTimeout(() => this.showHolidayModal(), 100);
                }
            });
        });
        
        document.querySelectorAll('.delete-holiday').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const holidayId = e.target.dataset.id;
                if (confirm('آیا از حذف این تعطیل مطمئن هستید؟')) {
                    this.removeHoliday(holidayId);
                    modal.remove();
                    setTimeout(() => this.showHolidayModal(), 100);
                }
            });
        });
    },
    
    // ===== نمایش فرم افزودن تعطیل =====
    showAddHolidayForm: function() {
        const modal = document.createElement('div');
        modal.id = 'addHolidayFormModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>➕ افزودن تعطیل جدید</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addHolidayForm">
                        <div class="form-group">
                            <label>عنوان تعطیل</label>
                            <input type="text" id="holidayName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>از تاریخ</label>
                            <input type="date" id="holidayStartDate" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>تا تاریخ</label>
                            <input type="date" id="holidayEndDate" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>نوع تعطیل</label>
                            <select id="holidayType" class="form-control">
                                <option value="annual">سالانه (هر سال)</option>
                                <option value="once">یکباره</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                            <button type="submit" class="btn btn-primary">افزودن تعطیل</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('addHolidayForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const holidayData = {
                name: document.getElementById('holidayName')?.value,
                startDate: document.getElementById('holidayStartDate')?.value,
                endDate: document.getElementById('holidayEndDate')?.value,
                type: document.getElementById('holidayType')?.value
            };
            
            if (holidayData.name && holidayData.startDate && holidayData.endDate) {
                this.addHoliday(holidayData);
                modal.remove();
                setTimeout(() => this.showHolidayModal(), 100);
            } else {
                App.showToast('لطفاً تمام فیلدها را پر کنید', 'error');
            }
        });
    },
    
    // ===== نمایش فرم ویرایش تعطیل =====
    showEditHolidayForm: function(holiday) {
        const modal = document.createElement('div');
        modal.id = 'editHolidayFormModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>✏️ ویرایش تعطیل</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editHolidayForm">
                        <div class="form-group">
                            <label>عنوان تعطیل</label>
                            <input type="text" id="holidayName" class="form-control" value="${holiday.name}" required>
                        </div>
                        <div class="form-group">
                            <label>از تاریخ</label>
                            <input type="date" id="holidayStartDate" class="form-control" value="${holiday.startDate}" required>
                        </div>
                        <div class="form-group">
                            <label>تا تاریخ</label>
                            <input type="date" id="holidayEndDate" class="form-control" value="${holiday.endDate}" required>
                        </div>
                        <div class="form-group">
                            <label>نوع تعطیل</label>
                            <select id="holidayType" class="form-control">
                                <option value="annual" ${holiday.type === 'annual' ? 'selected' : ''}>سالانه (هر سال)</option>
                                <option value="once" ${holiday.type === 'once' ? 'selected' : ''}>یکباره</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                            <button type="submit" class="btn btn-primary">ذخیره تغییرات</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('editHolidayForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updatedHoliday = {
                id: holiday.id,
                name: document.getElementById('holidayName')?.value,
                startDate: document.getElementById('holidayStartDate')?.value,
                endDate: document.getElementById('holidayEndDate')?.value,
                type: document.getElementById('holidayType')?.value
            };
            
            this.updateHoliday(updatedHoliday);
            modal.remove();
            setTimeout(() => this.showHolidayModal(), 100);
        });
    },
    
    // ===== فرمت تاریخ =====
    formatDate: function(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fa-IR');
    }
};

// استایل‌های مدیریت تعطیلات
const holidayStyles = `
<style>
.holiday-actions {
    margin-bottom: 20px;
}

.holiday-table {
    margin-top: 15px;
    overflow-x: auto;
}

.holiday-status {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
    text-align: center;
}

.holiday-status.active {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.holiday-status.inactive {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.public-holidays {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
}

.public-holidays-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
}

.public-holiday-badge {
    background: var(--bg-secondary);
    padding: 4px 12px;
    border-radius: var(--radius-full);
    font-size: 12px;
}

.public-holiday-more {
    color: var(--text-tertiary);
    font-size: 12px;
}
</style>
`;

if (!document.querySelector('#holiday-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'holiday-styles';
    styleSheet.textContent = holidayStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    HolidayManager.init();
});

window.HolidayManager = HolidayManager;
