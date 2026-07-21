 /* ============================================
   BRANCH-MANAGEMENT.JS - مدیریت شعبات
   ============================================ */

const BranchManagement = {
    // لیست شعبات
    branchesList: [],
    
    // کسب‌وکار فعلی
    businessId: null,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadBranchesList();
        this.attachEvents();
        console.log('🏢 ماژول مدیریت شعبات راه‌اندازی شد');
    },
    
    // ===== بارگذاری لیست شعبات =====
    loadBranchesList: function() {
        const user = AuthSession.getUser();
        if (!user || user.role !== 'business') return;
        
        this.businessId = user.id;
        const saved = localStorage.getItem(`branches_${this.businessId}`);
        if (saved) {
            try {
                this.branchesList = JSON.parse(saved);
            } catch(e) {}
        }
        
        // شعبات نمونه
        if (this.branchesList.length === 0) {
            this.branchesList = [
                {
                    id: 'BR001',
                    name: 'شعبه مرکزی',
                    address: 'تهران، خیابان ولیعصر، نبش خیابان ملک',
                    phone: '021-12345678',
                    manager: 'مریم احمدی',
                    workHours: {
                        saturday: { start: '09:00', end: '20:00', active: true },
                        sunday: { start: '09:00', end: '20:00', active: true },
                        monday: { start: '09:00', end: '20:00', active: true },
                        tuesday: { start: '09:00', end: '20:00', active: true },
                        wednesday: { start: '09:00', end: '20:00', active: true },
                        thursday: { start: '09:00', end: '14:00', active: true },
                        friday: { start: null, end: null, active: false }
                    },
                    location: { lat: 35.774, lng: 51.418 },
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'BR002',
                    name: 'شعبه ونک',
                    address: 'تهران، ونک، خیابون ونک',
                    phone: '021-87654321',
                    manager: 'سارا کریمی',
                    workHours: {
                        saturday: { start: '10:00', end: '19:00', active: true },
                        sunday: { start: '10:00', end: '19:00', active: true },
                        monday: { start: '10:00', end: '19:00', active: true },
                        tuesday: { start: '10:00', end: '19:00', active: true },
                        wednesday: { start: '10:00', end: '19:00', active: true },
                        thursday: { start: '10:00', end: '13:00', active: true },
                        friday: { start: null, end: null, active: false }
                    },
                    location: { lat: 35.764, lng: 51.428 },
                    active: true,
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveBranchesList();
        }
    },
    
    // ===== ذخیره لیست شعبات =====
    saveBranchesList: function() {
        if (this.businessId) {
            localStorage.setItem(`branches_${this.businessId}`, JSON.stringify(this.branchesList));
        }
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('branch:add', (data) => {
            this.addBranch(data);
        });
        
        App.on('branch:remove', (data) => {
            this.removeBranch(data.branchId);
        });
        
        App.on('branch:update', (data) => {
            this.updateBranch(data);
        });
    },
    
    // ===== افزودن شعبه جدید =====
    addBranch: function(branchData) {
        const newBranch = {
            id: 'BR' + Date.now() + Math.floor(Math.random() * 1000),
            ...branchData,
            active: true,
            createdAt: new Date().toISOString()
        };
        
        this.branchesList.push(newBranch);
        this.saveBranchesList();
        
        App.showToast(`شعبه ${newBranch.name} با موفقیت اضافه شد`, 'success');
        App.emit('branch:added', newBranch);
        
        return newBranch;
    },
    
    // ===== حذف شعبه =====
    removeBranch: function(branchId) {
        const index = this.branchesList.findIndex(b => b.id === branchId);
        if (index !== -1) {
            const removedBranch = this.branchesList[index];
            this.branchesList.splice(index, 1);
            this.saveBranchesList();
            App.showToast(`شعبه ${removedBranch.name} حذف شد`, 'info');
            App.emit('branch:removed', removedBranch);
            return true;
        }
        return false;
    },
    
    // ===== به‌روزرسانی اطلاعات شعبه =====
    updateBranch: function(updatedData) {
        const index = this.branchesList.findIndex(b => b.id === updatedData.id);
        if (index !== -1) {
            this.branchesList[index] = { ...this.branchesList[index], ...updatedData };
            this.saveBranchesList();
            App.showToast(`اطلاعات شعبه ${this.branchesList[index].name} به‌روزرسانی شد`, 'success');
            App.emit('branch:updated', this.branchesList[index]);
            return true;
        }
        return false;
    },
    
    // ===== دریافت شعبات فعال =====
    getActiveBranches: function() {
        return this.branchesList.filter(b => b.active);
    },
    
    // ===== نمایش مودال مدیریت شعبات =====
    showBranchModal: function() {
        const modal = document.createElement('div');
        modal.id = 'branchModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>🏢 مدیریت شعبات</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="branch-actions">
                        <button class="btn btn-primary" id="addBranchBtn">➕ افزودن شعبه جدید</button>
                    </div>
                    
                    <div class="branch-list">
                        <h4>لیست شعبات (${this.branchesList.length})</h4>
                        <div class="branch-grid">
                            ${this.branchesList.map(branch => `
                                <div class="branch-card" data-branch-id="${branch.id}">
                                    <div class="branch-header">
                                        <h4>${branch.name}</h4>
                                        <span class="branch-status ${branch.active ? 'active' : 'inactive'}">${branch.active ? 'فعال' : 'غیرفعال'}</span>
                                    </div>
                                    <div class="branch-info">
                                        <p>📍 ${branch.address}</p>
                                        <p>📞 ${branch.phone}</p>
                                        <p>👤 مدیر: ${branch.manager}</p>
                                    </div>
                                    <div class="branch-actions-btn">
                                        <button class="btn btn-outline btn-small edit-branch" data-id="${branch.id}">✏️ ویرایش</button>
                                        <button class="btn btn-outline btn-small delete-branch" data-id="${branch.id}">🗑️ حذف</button>
                                    </div>
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
        
        document.getElementById('addBranchBtn')?.addEventListener('click', () => {
            this.showAddBranchForm();
            modal.remove();
        });
        
        document.querySelectorAll('.edit-branch').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const branchId = e.target.dataset.id;
                const branch = this.branchesList.find(b => b.id === branchId);
                if (branch) {
                    this.showEditBranchForm(branch);
                    modal.remove();
                }
            });
        });
        
        document.querySelectorAll('.delete-branch').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const branchId = e.target.dataset.id;
                if (confirm('آیا از حذف این شعبه مطمئن هستید؟')) {
                    this.removeBranch(branchId);
                    modal.remove();
                    setTimeout(() => this.showBranchModal(), 100);
                }
            });
        });
    },
    
    // ===== نمایش فرم افزودن شعبه =====
    showAddBranchForm: function() {
        const modal = document.createElement('div');
        modal.id = 'addBranchFormModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>➕ افزودن شعبه جدید</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addBranchForm">
                        <div class="form-group">
                            <label>نام شعبه</label>
                            <input type="text" id="branchName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>آدرس</label>
                            <textarea id="branchAddress" class="form-control" rows="2" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>شماره تماس</label>
                            <input type="tel" id="branchPhone" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>نام مدیر</label>
                            <input type="text" id="branchManager" class="form-control" required>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                            <button type="submit" class="btn btn-primary">افزودن شعبه</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('addBranchForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const branchData = {
                name: document.getElementById('branchName')?.value,
                address: document.getElementById('branchAddress')?.value,
                phone: document.getElementById('branchPhone')?.value,
                manager: document.getElementById('branchManager')?.value
            };
            
            if (branchData.name && branchData.address && branchData.phone) {
                this.addBranch(branchData);
                modal.remove();
                setTimeout(() => this.showBranchModal(), 100);
            } else {
                App.showToast('لطفاً تمام فیلدها را پر کنید', 'error');
            }
        });
    },
    
    // ===== نمایش فرم ویرایش شعبه =====
    showEditBranchForm: function(branch) {
        const modal = document.createElement('div');
        modal.id = 'editBranchFormModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>✏️ ویرایش اطلاعات شعبه</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editBranchForm">
                        <div class="form-group">
                            <label>نام شعبه</label>
                            <input type="text" id="branchName" class="form-control" value="${branch.name}" required>
                        </div>
                        <div class="form-group">
                            <label>آدرس</label>
                            <textarea id="branchAddress" class="form-control" rows="2" required>${branch.address}</textarea>
                        </div>
                        <div class="form-group">
                            <label>شماره تماس</label>
                            <input type="tel" id="branchPhone" class="form-control" value="${branch.phone}" required>
                        </div>
                        <div class="form-group">
                            <label>نام مدیر</label>
                            <input type="text" id="branchManager" class="form-control" value="${branch.manager}" required>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="branchActive" ${branch.active ? 'checked' : ''}> فعال
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
        
        document.getElementById('editBranchForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updatedBranch = {
                id: branch.id,
                name: document.getElementById('branchName')?.value,
                address: document.getElementById('branchAddress')?.value,
                phone: document.getElementById('branchPhone')?.value,
                manager: document.getElementById('branchManager')?.value,
                active: document.getElementById('branchActive')?.checked
            };
            
            this.updateBranch(updatedBranch);
            modal.remove();
            setTimeout(() => this.showBranchModal(), 100);
        });
    }
};

// استایل‌های مدیریت شعبات
const branchStyles = `
<style>
.branch-actions {
    margin-bottom: 20px;
}

.branch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 15px;
}

.branch-card {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 15px;
    transition: all var(--transition-fast);
}

.branch-card:hover {
    box-shadow: var(--shadow-md);
}

.branch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
}

.branch-header h4 {
    margin: 0;
}

.branch-status {
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.branch-status.active {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.branch-status.inactive {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.branch-info p {
    margin: 5px 0;
    font-size: 13px;
    color: var(--text-secondary);
}

.branch-actions-btn {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    justify-content: flex-end;
}
</style>
`;

if (!document.querySelector('#branch-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'branch-styles';
    styleSheet.textContent = branchStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    BranchManagement.init();
});

window.BranchManagement = BranchManagement;
