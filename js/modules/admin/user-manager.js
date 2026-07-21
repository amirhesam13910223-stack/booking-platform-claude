 /* ============================================
   USER-MANAGER.JS - مدیریت کاربران
   ============================================ */

const UserManager = {
    // لیست کاربران
    users: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadUsers();
        this.attachEvents();
        console.log('👥 ماژول مدیریت کاربران راه‌اندازی شد');
    },
    
    // ===== بارگذاری کاربران =====
    loadUsers: function() {
        const saved = localStorage.getItem('registered_users');
        if (saved) {
            try {
                this.users = JSON.parse(saved);
            } catch(e) {}
        }
        
        // کاربران نمونه
        if (this.users.length === 0) {
            this.users = [
                {
                    id: 1,
                    name: 'کاربر تست',
                    phone: '09121234567',
                    email: 'test@example.com',
                    role: 'user',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    bookingsCount: 5,
                    totalSpent: 1250000
                },
                {
                    id: 2,
                    name: 'کسب‌وکار نمونه',
                    phone: '09129876543',
                    email: 'business@example.com',
                    role: 'business',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    lastLogin: null,
                    bookingsCount: 0,
                    totalSpent: 0
                }
            ];
            this.saveUsers();
        }
    },
    
    // ===== ذخیره کاربران =====
    saveUsers: function() {
        localStorage.setItem('registered_users', JSON.stringify(this.users));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('user:block', (data) => {
            this.blockUser(data.userId);
        });
        
        App.on('user:unblock', (data) => {
            this.unblockUser(data.userId);
        });
        
        App.on('user:change-role', (data) => {
            this.changeUserRole(data.userId, data.newRole);
        });
    },
    
    // ===== مسدود کردن کاربر =====
    blockUser: function(userId) {
        const user = this.users.find(u => u.id == userId);
        if (user) {
            user.status = 'blocked';
            this.saveUsers();
            App.showToast(`کاربر ${user.name} مسدود شد`, 'warning');
            App.emit('user:blocked', { userId, user });
            return true;
        }
        return false;
    },
    
    // ===== رفع مسدودیت کاربر =====
    unblockUser: function(userId) {
        const user = this.users.find(u => u.id == userId);
        if (user) {
            user.status = 'active';
            this.saveUsers();
            App.showToast(`مسدودیت کاربر ${user.name} رفع شد`, 'success');
            App.emit('user:unblocked', { userId, user });
            return true;
        }
        return false;
    },
    
    // ===== تغییر نقش کاربر =====
    changeUserRole: function(userId, newRole) {
        const user = this.users.find(u => u.id == userId);
        if (user && ['user', 'business', 'admin'].includes(newRole)) {
            const oldRole = user.role;
            user.role = newRole;
            this.saveUsers();
            App.showToast(`نقش کاربر ${user.name} از ${oldRole} به ${newRole} تغییر یافت`, 'success');
            App.emit('user:role-changed', { userId, user, oldRole, newRole });
            return true;
        }
        return false;
    },
    
    // ===== حذف کاربر =====
    deleteUser: function(userId) {
        if (confirm('آیا از حذف این کاربر مطمئن هستید؟')) {
            const index = this.users.findIndex(u => u.id == userId);
            if (index !== -1) {
                const removedUser = this.users[index];
                this.users.splice(index, 1);
                this.saveUsers();
                App.showToast(`کاربر ${removedUser.name} حذف شد`, 'info');
                App.emit('user:deleted', removedUser);
                return true;
            }
        }
        return false;
    },
    
    // ===== جستجوی کاربران =====
    searchUsers: function(query) {
        if (!query) return this.users;
        
        const lowerQuery = query.toLowerCase();
        return this.users.filter(u => 
            u.name.toLowerCase().includes(lowerQuery) ||
            u.phone.includes(lowerQuery) ||
            (u.email && u.email.toLowerCase().includes(lowerQuery))
        );
    },
    
    // ===== نمایش مودال مدیریت کاربران =====
    showUserManager: function() {
        const modal = document.createElement('div');
        modal.id = 'userManagerModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>👥 مدیریت کاربران</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-search">
                        <input type="text" id="userSearch" class="form-control" placeholder="جستجوی کاربر...">
                    </div>
                    
                    <div class="user-stats">
                        <span>کل کاربران: <strong>${this.users.length}</strong></span>
                        <span>فعال: <strong class="text-success">${this.users.filter(u => u.status === 'active').length}</strong></span>
                        <span>مسدود: <strong class="text-danger">${this.users.filter(u => u.status === 'blocked').length}</strong></span>
                        <span>در انتظار: <strong class="text-warning">${this.users.filter(u => u.status === 'pending').length}</strong></span>
                    </div>
                    
                    <div class="user-table">
                        <div class="table-header">
                            <span>نام</span>
                            <span>شماره تماس</span>
                            <span>نقش</span>
                            <span>وضعیت</span>
                            <span>تاریخ عضویت</span>
                            <span>عملیات</span>
                        </div>
                        <div id="usersList">
                            ${this.renderUsersList(this.users)}
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // جستجو
        document.getElementById('userSearch')?.addEventListener('input', (e) => {
            const filtered = this.searchUsers(e.target.value);
            document.getElementById('usersList').innerHTML = this.renderUsersList(filtered);
        });
        
        // دکمه‌های اکشن
        this.attachUserActions();
    },
    
    // ===== رندر لیست کاربران =====
    renderUsersList: function(users) {
        if (users.length === 0) {
            return '<div class="empty-state">هیچ کاربری یافت نشد</div>';
        }
        
        return users.map(user => `
            <div class="table-row" data-user-id="${user.id}">
                <span><strong>${user.name}</strong><br><small>${user.email || ''}</small></span>
                <span>${user.phone}</span>
                <span class="user-role ${user.role}">${this.getRoleName(user.role)}</span>
                <span class="user-status ${user.status}">${this.getStatusName(user.status)}</span>
                <span>${this.formatDate(user.createdAt)}</span>
                <span class="user-actions">
                    <button class="icon-btn view-user" data-id="${user.id}" title="مشاهده">👁️</button>
                    ${user.status !== 'blocked' ? 
                        `<button class="icon-btn block-user" data-id="${user.id}" title="مسدود">🔴</button>` :
                        `<button class="icon-btn unblock-user" data-id="${user.id}" title="رفع مسدودیت">🟢</button>`
                    }
                    <button class="icon-btn delete-user" data-id="${user.id}" title="حذف">🗑️</button>
                </span>
            </div>
        `).join('');
    },
    
    // ===== اتصال دکمه‌های اکشن =====
    attachUserActions: function() {
        // مشاهده کاربر
        document.querySelectorAll('.view-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                const user = this.users.find(u => u.id == userId);
                if (user) {
                    this.showUserDetails(user);
                }
            });
        });
        
        // مسدود کردن
        document.querySelectorAll('.block-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                this.blockUser(userId);
                this.refreshModal();
            });
        });
        
        // رفع مسدودیت
        document.querySelectorAll('.unblock-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                this.unblockUser(userId);
                this.refreshModal();
            });
        });
        
        // حذف
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                this.deleteUser(userId);
                this.refreshModal();
            });
        });
    },
    
    // ===== نمایش جزئیات کاربر =====
    showUserDetails: function(user) {
        const modal = document.createElement('div');
        modal.id = 'userDetailsModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👤 جزئیات کاربر</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-details">
                        <div class="detail-row">
                            <span>نام کامل:</span>
                            <strong>${user.name}</strong>
                        </div>
                        <div class="detail-row">
                            <span>شماره تماس:</span>
                            <strong>${user.phone}</strong>
                        </div>
                        <div class="detail-row">
                            <span>ایمیل:</span>
                            <strong>${user.email || '-'}</strong>
                        </div>
                        <div class="detail-row">
                            <span>نقش:</span>
                            <strong class="user-role ${user.role}">${this.getRoleName(user.role)}</strong>
                        </div>
                        <div class="detail-row">
                            <span>وضعیت:</span>
                            <strong class="user-status ${user.status}">${this.getStatusName(user.status)}</strong>
                        </div>
                        <div class="detail-row">
                            <span>تاریخ عضویت:</span>
                            <strong>${this.formatDate(user.createdAt)}</strong>
                        </div>
                        <div class="detail-row">
                            <span>آخرین ورود:</span>
                            <strong>${user.lastLogin ? this.formatDate(user.lastLogin) : '-'}</strong>
                        </div>
                        <div class="detail-row">
                            <span>تعداد نوبت‌ها:</span>
                            <strong>${user.bookingsCount || 0}</strong>
                        </div>
                        <div class="detail-row">
                            <span>مجموع هزینه:</span>
                            <strong>${this.formatPrice(user.totalSpent || 0)}</strong>
                        </div>
                    </div>
                    
                    <div class="user-actions-detail">
                        <select id="changeRoleSelect" class="form-control">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>کاربر عادی</option>
                            <option value="business" ${user.role === 'business' ? 'selected' : ''}>کسب‌وکار</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>ادمین</option>
                        </select>
                        <button class="btn btn-primary" id="changeRoleBtn">تغییر نقش</button>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('changeRoleBtn')?.addEventListener('click', () => {
            const newRole = document.getElementById('changeRoleSelect')?.value;
            this.changeUserRole(user.id, newRole);
            modal.remove();
            setTimeout(() => this.showUserManager(), 100);
        });
    },
    
    // ===== رفرش مودال =====
    refreshModal: function() {
        const modal = document.getElementById('userManagerModal');
        if (modal) {
            modal.remove();
            this.showUserManager();
        }
    },
    
    // ===== توابع کمکی =====
    getRoleName: function(role) {
        const roles = { user: 'کاربر', business: 'کسب‌وکار', admin: 'ادمین' };
        return roles[role] || role;
    },
    
    getStatusName: function(status) {
        const statuses = { active: 'فعال', blocked: 'مسدود', pending: 'در انتظار' };
        return statuses[status] || status;
    },
    
    formatDate: function(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fa-IR');
    },
    
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

// استایل‌های مدیریت کاربران
const userManagerStyles = `
<style>
.user-search {
    margin-bottom: 20px;
}

.user-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    padding: 10px;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
}

.user-stats span {
    font-size: 14px;
}

.user-table {
    margin-top: 15px;
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
}

.user-role {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.user-role.user { background: var(--color-info-soft); color: var(--color-info); }
.user-role.business { background: var(--color-primary-soft); color: var(--color-primary); }
.user-role.admin { background: var(--color-danger-soft); color: var(--color-danger); }

.user-status {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.user-status.active { background: var(--color-success-soft); color: var(--color-success); }
.user-status.blocked { background: var(--color-danger-soft); color: var(--color-danger); }
.user-status.pending { background: var(--color-warning-soft); color: var(--color-warning); }

.user-actions {
    display: flex;
    gap: 5px;
}

.user-details {
    margin-bottom: 20px;
}

.user-actions-detail {
    display: flex;
    gap: 10px;
    margin: 20px 0;
}
</style>
`;

if (!document.querySelector('#user-manager-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'user-manager-styles';
    styleSheet.textContent = userManagerStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    UserManager.init();
});

window.UserManager = UserManager;
