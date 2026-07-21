 /* ============================================
   STAFF-MANAGEMENT.JS - مدیریت کارکنان
   ============================================ */

const StaffManagement = {
    // لیست کارکنان
    staffList: [],
    
    // کسب‌وکار فعلی
    businessId: null,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadStaffList();
        this.attachEvents();
        console.log('👥 ماژول مدیریت کارکنان راه‌اندازی شد');
    },
    
    // ===== بارگذاری لیست کارکنان =====
    loadStaffList: function() {
        const user = AuthSession.getUser();
        if (!user || user.role !== 'business') return;
        
        this.businessId = user.id;
        const saved = localStorage.getItem(`staff_${this.businessId}`);
        if (saved) {
            try {
                this.staffList = JSON.parse(saved);
            } catch(e) {}
        }
        
        // کارکنان نمونه
        if (this.staffList.length === 0) {
            this.staffList = [
                {
                    id: 'STF001',
                    name: 'مریم احمدی',
                    role: 'مدیر',
                    phone: '09121111111',
                    email: 'maryam@example.com',
                    specialty: 'مدیریت',
                    workDays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'],
                    workHours: { start: '09:00', end: '18:00' },
                    active: true,
                    joinedAt: new Date().toISOString()
                },
                {
                    id: 'STF002',
                    name: 'سارا کریمی',
                    role: 'آرایشگر',
                    phone: '09122222222',
                    email: 'sara@example.com',
                    specialty: 'کوتاهی مو زنانه',
                    workDays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'],
                    workHours: { start: '10:00', end: '19:00' },
                    active: true,
                    joinedAt: new Date().toISOString()
                },
                {
                    id: 'STF003',
                    name: 'نرگس رضایی',
                    role: 'آرایشگر',
                    phone: '09123333333',
                    email: 'narges@example.com',
                    specialty: 'رنگ مو',
                    workDays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'],
                    workHours: { start: '09:00', end: '17:00' },
                    active: true,
                    joinedAt: new Date().toISOString()
                }
            ];
            this.saveStaffList();
        }
    },
    
    // ===== ذخیره لیست کارکنان =====
    saveStaffList: function() {
        if (this.businessId) {
            localStorage.setItem(`staff_${this.businessId}`, JSON.stringify(this.staffList));
        }
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('staff:add', (data) => {
            this.addStaff(data);
        });
        
        App.on('staff:remove', (data) => {
            this.removeStaff(data.staffId);
        });
        
        App.on('staff:update', (data) => {
            this.updateStaff(data);
        });
    },
    
    // ===== افزودن کارمند جدید =====
    addStaff: function(staffData) {
        const newStaff = {
            id: 'STF' + Date.now() + Math.floor(Math.random() * 1000),
            ...staffData,
            active: true,
            joinedAt: new Date().toISOString()
        };
        
        this.staffList.push(newStaff);
        this.saveStaffList();
        
        App.showToast(`کارمند ${newStaff.name} با موفقیت اضافه شد`, 'success');
        App.emit('staff:added', newStaff);
        
        return newStaff;
    },
    
    // ===== حذف کارمند =====
    removeStaff: function(staffId) {
        const index = this.staffList.findIndex(s => s.id === staffId);
        if (index !== -1) {
            const removedStaff = this.staffList[index];
            this.staffList.splice(index, 1);
            this.saveStaffList();
            App.showToast(`کارمند ${removedStaff.name} حذف شد`, 'info');
            App.emit('staff:removed', removedStaff);
            return true;
        }
        return false;
    },
    
    // ===== به‌روزرسانی اطلاعات کارمند =====
    updateStaff: function(updatedData) {
        const index = this.staffList.findIndex(s => s.id === updatedData.id);
        if (index !== -1) {
            this.staffList[index] = { ...this.staffList[index], ...updatedData };
            this.saveStaffList();
            App.showToast(`اطلاعات کارمند ${this.staffList[index].name} به‌روزرسانی شد`, 'success');
            App.emit('staff:updated', this.staffList[index]);
            return true;
        }
        return false;
    },
    
    // ===== دریافت لیست کارکنان فعال =====
    getActiveStaff: function() {
        return this.staffList.filter(s => s.active);
    },
    
    // ===== دریافت کارمند بر اساس نقش =====
    getStaffByRole: function(role) {
        return this.staffList.filter(s => s.role === role && s.active);
    },
    
    // ===== نمایش مودال مدیریت کارکنان =====
    showStaffModal: function() {
        const modal = document.createElement('div');
        modal.id = 'staffModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>👥 مدیریت کارکنان</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="staff-actions">
                        <button class="btn btn-primary" id="addStaffBtn">➕ افزودن کارمند جدید</button>
                    </div>
                    
                    <div class="staff-list">
                        <h4>لیست کارکنان (${this.staffList.length})</h4>
                        <div class="staff-table">
                            <div class="table-header">
                                <span>نام</span>
                                <span>نقش</span>
                                <span>تخصص</span>
                                <span>شماره تماس</span>
                                <span>وضعیت</span>
                                <span>عملیات</span>
                            </div>
                            ${this.staffList.map(staff => `
                                <div class="table-row" data-staff-id="${staff.id}">
                                    <span><strong>${staff.name}</strong></span>
                                    <span>${staff.role}</span>
                                    <span>${staff.specialty || '-'}</span>
                                    <span>${staff.phone}</span>
                                    <span class="staff-status ${staff.active ? 'active' : 'inactive'}">${staff.active ? 'فعال' : 'غیرفعال'}</span>
                                    <span>
                                        <button class="icon-btn edit-staff" data-id="${staff.id}">✏️</button>
                                        <button class="icon-btn delete-staff" data-id="${staff.id}">🗑️</button>
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('addStaffBtn')?.addEventListener('click', () => {
            this.showAddStaffForm();
            modal.remove();
        });
        
        document.querySelectorAll('.edit-staff').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const staffId = e.target.dataset.id;
                const staff = this.staffList.find(s => s.id === staffId);
                if (staff) {
                    this.showEditStaffForm(staff);
                    modal.remove();
                }
            });
        });
        
        document.querySelectorAll('.delete-staff').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const staffId = e.target.dataset.id;
                if (confirm('آیا از حذف این کارمند مطمئن هستید؟')) {
                    this.removeStaff(staffId);
                    modal.remove();
                    setTimeout(() => this.showStaffModal(), 100);
                }
            });
        });
    },
    
    // ===== نمایش فرم افزودن کارمند =====
    showAddStaffForm: function() {
        const modal = document.createElement('div');
        modal.id = 'addStaffFormModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>➕ افزودن کارمند جدید</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addStaffForm">
                        <div class="form-group">
                            <label>نام کامل</label>
                            <input type="text" id="staffName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>نقش</label>
                            <select id="staffRole" class="form-control">
                                <option value="آرایشگر">آرایشگر</option>
                                <option value="پزشک">پزشک</option>
                                <option value="مشاور">مشاور</option>
                                <option value="پذیرش">پذیرش</option>
                                <option value="مدیر">مدیر</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>تخصص</label>
                            <input type="text" id="staffSpecialty" class="form-control" placeholder="مثلاً کوتاهی مو، رنگ مو">
                        </div>
                        <div class="form-group">
                            <label>شماره تماس</label>
                            <input type="tel" id="staffPhone" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>ایمیل</label>
                            <input type="email" id="staffEmail" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>ساعات کاری</label>
                            <div class="time-range">
                                <input type="time" id="workStart" class="form-control" value="09:00">
                                <span>تا</span>
                                <input type="time" id="workEnd" class="form-control" value="18:00">
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                            <button type="submit" class="btn btn-primary">افزودن کارمند</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('addStaffForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const staffData = {
                name: document.getElementById('staffName')?.value,
                role: document.getElementById('staffRole')?.value,
                specialty: document.getElementById('staffSpecialty')?.value,
                phone: document.getElementById('staffPhone')?.value,
                email: document.getElementById('staffEmail')?.value,
                workHours: {
                    start: document.getElementById('workStart')?.value,
                    end: document.getElementById('workEnd')?.value
                }
            };
            
            if (staffData.name && staffData.phone) {
                this.addStaff(staffData);
                modal.remove();
                setTimeout(() => this.showStaffModal(), 100);
            } else {
                App.showToast('لطفاً نام و شماره تماس را وارد کنید', 'error');
            }
        });
    },
    
    // ===== نمایش فرم ویرایش کارمند =====
    showEditStaffForm: function(staff) {
        const modal = document.createElement('div');
        modal.id = 'editStaffFormModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>✏️ ویرایش اطلاعات کارمند</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editStaffForm">
                        <div class="form-group">
                            <label>نام کامل</label>
                            <input type="text" id="staffName" class="form-control" value="${staff.name}" required>
                        </div>
                        <div class="form-group">
                            <label>نقش</label>
                            <select id="staffRole" class="form-control">
                                <option value="آرایشگر" ${staff.role === 'آرایشگر' ? 'selected' : ''}>آرایشگر</option>
                                <option value="پزشک" ${staff.role === 'پزشک' ? 'selected' : ''}>پزشک</option>
                                <option value="مشاور" ${staff.role === 'مشاور' ? 'selected' : ''}>مشاور</option>
                                <option value="پذیرش" ${staff.role === 'پذیرش' ? 'selected' : ''}>پذیرش</option>
                                <option value="مدیر" ${staff.role === 'مدیر' ? 'selected' : ''}>مدیر</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>تخصص</label>
                            <input type="text" id="staffSpecialty" class="form-control" value="${staff.specialty || ''}">
                        </div>
                        <div class="form-group">
                            <label>شماره تماس</label>
                            <input type="tel" id="staffPhone" class="form-control" value="${staff.phone}" required>
                        </div>
                        <div class="form-group">
                            <label>ایمیل</label>
                            <input type="email" id="staffEmail" class="form-control" value="${staff.email || ''}">
                        </div>
                        <div class="form-group">
                            <label>ساعات کاری</label>
                            <div class="time-range">
                                <input type="time" id="workStart" class="form-control" value="${staff.workHours?.start || '09:00'}">
                                <span>تا</span>
                                <input type="time" id="workEnd" class="form-control" value="${staff.workHours?.end || '18:00'}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="staffActive" ${staff.active ? 'checked' : ''}> فعال
                            </label>
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
        
        document.getElementById('editStaffForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updatedStaff = {
                id: staff.id,
                name: document.getElementById('staffName')?.value,
                role: document.getElementById('staffRole')?.value,
                specialty: document.getElementById('staffSpecialty')?.value,
                phone: document.getElementById('staffPhone')?.value,
                email: document.getElementById('staffEmail')?.value,
                workHours: {
                    start: document.getElementById('workStart')?.value,
                    end: document.getElementById('workEnd')?.value
                },
                active: document.getElementById('staffActive')?.checked
            };
            
            this.updateStaff(updatedStaff);
            modal.remove();
            setTimeout(() => this.showStaffModal(), 100);
        });
    }
};

// استایل‌های مدیریت کارکنان
const staffStyles = `
<style>
.staff-actions {
    margin-bottom: 20px;
    text-align: left;
}

.staff-table {
    margin-top: 15px;
    overflow-x: auto;
}

.table-header, .table-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1.5fr 1.5fr 0.8fr 0.8fr;
    gap: 10px;
    padding: 10px;
    border-bottom: 1px solid var(--border-color);
    align-items: center;
}

.table-header {
    background: var(--bg-secondary);
    font-weight: bold;
    border-radius: var(--radius-md);
}

.staff-status {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
    text-align: center;
}

.staff-status.active {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.staff-status.inactive {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 5px;
}

.time-range {
    display: flex;
    gap: 10px;
    align-items: center;
}

.time-range input {
    flex: 1;
}

@media (max-width: 768px) {
    .table-header, .table-row {
        grid-template-columns: 1fr;
        gap: 5px;
    }
    
    .table-header {
        display: none;
    }
    
    .table-row {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        margin-bottom: 10px;
    }
}
</style>
`;

if (!document.querySelector('#staff-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'staff-styles';
    styleSheet.textContent = staffStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    StaffManagement.init();
});

window.StaffManagement = StaffManagement;
