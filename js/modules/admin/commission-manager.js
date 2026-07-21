 /* ============================================
   COMMISSION-MANAGER.JS - مدیریت کارمزدها
   ============================================ */

const CommissionManager = {
    // تنظیمات کارمزد
    commissionSettings: {
        defaultRate: 3,           // درصد پیش‌فرض کارمزد
        minCommission: 1000,      // حداقل کارمزد (تومان)
        maxCommission: 100000,    // حداکثر کارمزد (تومان)
        specialRates: {},         // نرخ‌های ویژه برای کسب‌وکارهای خاص
        categoryRates: {          // نرخ بر اساس دسته‌بندی
            'beauty': 2.5,
            'medical': 3.5,
            'sports': 2,
            'education': 2.5
        }
    },
    
    // تاریخچه کارمزدها
    commissionHistory: [],
    
    // تسویه‌ها
    settlements: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadSettings();
        this.loadHistory();
        this.loadSettlements();
        this.attachEvents();
        console.log('💰 ماژول مدیریت کارمزدها راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadSettings: function() {
        const saved = localStorage.getItem('commission_settings');
        if (saved) {
            try {
                this.commissionSettings = JSON.parse(saved);
            } catch(e) {}
        }
        
        // نرخ‌های ویژه نمونه
        if (Object.keys(this.commissionSettings.specialRates).length === 0) {
            this.commissionSettings.specialRates = {
                'BIZ001': { rate: 2, name: 'سالن زیبایی لیدا', expiresAt: null },
                'BIZ002': { rate: 2.5, name: 'کلینیک دکتر محمدی', expiresAt: null }
            };
        }
    },
    
    // ===== ذخیره تنظیمات =====
    saveSettings: function() {
        localStorage.setItem('commission_settings', JSON.stringify(this.commissionSettings));
    },
    
    // ===== بارگذاری تاریخچه =====
    loadHistory: function() {
        const saved = localStorage.getItem('commission_history');
        if (saved) {
            try {
                this.commissionHistory = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره تاریخچه =====
    saveHistory: function() {
        localStorage.setItem('commission_history', JSON.stringify(this.commissionHistory.slice(0, 500)));
    },
    
    // ===== بارگذاری تسویه‌ها =====
    loadSettlements: function() {
        const saved = localStorage.getItem('settlements');
        if (saved) {
            try {
                this.settlements = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره تسویه‌ها =====
    saveSettlements: function() {
        localStorage.setItem('settlements', JSON.stringify(this.settlements));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('commission:calculate', (data) => {
            return this.calculateCommission(data);
        });
        
        App.on('commission:settle', (data) => {
            this.settleCommission(data);
        });
    },
    
    // ===== محاسبه کارمزد =====
    calculateCommission: function(data) {
        const { amount, businessId, category } = data;
        
        let rate = this.commissionSettings.defaultRate;
        
        // بررسی نرخ ویژه کسب‌وکار
        if (businessId && this.commissionSettings.specialRates[businessId]) {
            rate = this.commissionSettings.specialRates[businessId].rate;
        }
        // بررسی نرخ دسته‌بندی
        else if (category && this.commissionSettings.categoryRates[category]) {
            rate = this.commissionSettings.categoryRates[category];
        }
        
        let commission = (amount * rate) / 100;
        
        // اعمال حداقل و حداکثر
        if (commission < this.commissionSettings.minCommission) {
            commission = this.commissionSettings.minCommission;
        }
        if (commission > this.commissionSettings.maxCommission) {
            commission = this.commissionSettings.maxCommission;
        }
        
        const netAmount = amount - commission;
        
        return {
            originalAmount: amount,
            commissionRate: rate,
            commissionAmount: commission,
            netAmount: netAmount,
            businessId: businessId,
            category: category
        };
    },
    
    // ===== ثبت کارمزد =====
    recordCommission: function(data) {
        const { transactionId, businessId, amount, commission, netAmount, bookingId } = data;
        
        const record = {
            id: 'COM' + Date.now() + Math.floor(Math.random() * 10000),
            transactionId: transactionId,
            businessId: businessId,
            bookingId: bookingId,
            amount: amount,
            commission: commission,
            netAmount: netAmount,
            status: 'pending',
            createdAt: new Date().toISOString(),
            settledAt: null
        };
        
        this.commissionHistory.unshift(record);
        this.saveHistory();
        
        App.emit('commission:recorded', record);
        return record;
    },
    
    // ===== تسویه کارمزد =====
    settleCommission: function(data) {
        const { commissionIds, businessId, paymentMethod } = data;
        
        const commissions = this.commissionHistory.filter(c => 
            (commissionIds ? commissionIds.includes(c.id) : c.businessId === businessId) && 
            c.status === 'pending'
        );
        
        if (commissions.length === 0) {
            App.showToast('هیچ کارمزدی برای تسویه وجود ندارد', 'warning');
            return false;
        }
        
        const totalAmount = commissions.reduce((sum, c) => sum + c.netAmount, 0);
        
        const settlement = {
            id: 'SET' + Date.now() + Math.floor(Math.random() * 10000),
            businessId: businessId,
            commissions: commissions.map(c => c.id),
            totalAmount: totalAmount,
            paymentMethod: paymentMethod || 'bank_transfer',
            status: 'completed',
            createdAt: new Date().toISOString(),
            settledBy: AuthSession.getUser()?.id
        };
        
        // به‌روزرسانی وضعیت کارمزدها
        commissions.forEach(c => {
            c.status = 'settled';
            c.settledAt = new Date().toISOString();
            c.settlementId = settlement.id;
        });
        
        this.commissionHistory = this.commissionHistory.map(c => {
            const updated = commissions.find(uc => uc.id === c.id);
            return updated || c;
        });
        
        this.settlements.unshift(settlement);
        
        this.saveHistory();
        this.saveSettlements();
        
        App.showToast(`تسویه به مبلغ ${this.formatPrice(totalAmount)} با موفقیت انجام شد`, 'success');
        App.emit('commission:settled', settlement);
        
        return settlement;
    },
    
    // ===== به‌روزرسانی نرخ کارمزد =====
    updateCommissionRate: function(rateType, value) {
        if (rateType === 'default') {
            this.commissionSettings.defaultRate = value;
        } else if (rateType === 'min') {
            this.commissionSettings.minCommission = value;
        } else if (rateType === 'max') {
            this.commissionSettings.maxCommission = value;
        } else if (rateType === 'category') {
            this.commissionSettings.categoryRates = value;
        }
        
        this.saveSettings();
        App.showToast('نرخ کارمزد با موفقیت به‌روزرسانی شد', 'success');
        App.emit('commission:rate-updated', { rateType, value });
    },
    
    // ===== افزودن نرخ ویژه =====
    addSpecialRate: function(businessId, rate, name, expiresAt = null) {
        this.commissionSettings.specialRates[businessId] = {
            rate: rate,
            name: name,
            expiresAt: expiresAt,
            createdAt: new Date().toISOString()
        };
        
        this.saveSettings();
        App.showToast(`نرخ ویژه برای ${name} با موفقیت اضافه شد`, 'success');
        App.emit('commission:special-rate-added', { businessId, rate, name });
    },
    
    // ===== حذف نرخ ویژه =====
    removeSpecialRate: function(businessId) {
        if (this.commissionSettings.specialRates[businessId]) {
            delete this.commissionSettings.specialRates[businessId];
            this.saveSettings();
            App.showToast('نرخ ویژه حذف شد', 'info');
            return true;
        }
        return false;
    },
    
    // ===== نمایش مودال مدیریت کارمزد =====
    showCommissionModal: function() {
        const modal = document.createElement('div');
        modal.id = 'commissionModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>💰 مدیریت کارمزدها</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="commission-tabs">
                        <button class="tab-btn active" data-tab="settings">تنظیمات</button>
                        <button class="tab-btn" data-tab="history">تاریخچه کارمزدها</button>
                        <button class="tab-btn" data-tab="settlements">تسویه‌ها</button>
                        <button class="tab-btn" data-tab="special">نرخ‌های ویژه</button>
                    </div>
                    
                    <div id="settingsTab" class="tab-content active">
                        <div class="settings-form">
                            <div class="form-group">
                                <label>نرخ پیش‌فرض کارمزد (%)</label>
                                <input type="number" id="defaultRate" class="form-control" value="${this.commissionSettings.defaultRate}" step="0.5" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>حداقل کارمزد (تومان)</label>
                                <input type="number" id="minCommission" class="form-control" value="${this.commissionSettings.minCommission}">
                            </div>
                            <div class="form-group">
                                <label>حداکثر کارمزد (تومان)</label>
                                <input type="number" id="maxCommission" class="form-control" value="${this.commissionSettings.maxCommission}">
                            </div>
                            <button class="btn btn-primary" id="saveSettingsBtn">ذخیره تنظیمات</button>
                        </div>
                        
                        <div class="category-rates">
                            <h4>نرخ کارمزد بر اساس دسته‌بندی</h4>
                            <div class="category-rates-list">
                                ${Object.entries(this.commissionSettings.categoryRates).map(([cat, rate]) => `
                                    <div class="category-row">
                                        <span>${this.getCategoryName(cat)}</span>
                                        <input type="number" class="category-rate-input" data-category="${cat}" value="${rate}" step="0.5" style="width: 80px;">
                                        <span>%</span>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="btn btn-outline" id="saveCategoryRatesBtn">ذخیره نرخ‌ها</button>
                        </div>
                    </div>
                    
                    <div id="historyTab" class="tab-content">
                        <div class="history-filters">
                            <input type="text" id="historySearch" class="form-control" placeholder="جستجوی کسب‌وکار...">
                            <select id="historyStatus" class="form-control">
                                <option value="all">همه</option>
                                <option value="pending">در انتظار تسویه</option>
                                <option value="settled">تسویه شده</option>
                            </select>
                        </div>
                        <div class="history-list">
                            ${this.renderHistoryList()}
                        </div>
                    </div>
                    
                    <div id="settlementsTab" class="tab-content">
                        <div class="settlements-list">
                            ${this.renderSettlementsList()}
                        </div>
                    </div>
                    
                    <div id="specialTab" class="tab-content">
                        <div class="special-rates-form">
                            <h4>افزودن نرخ ویژه جدید</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>کد کسب‌وکار</label>
                                    <input type="text" id="specialBusinessId" class="form-control" placeholder="BIZ001">
                                </div>
                                <div class="form-group">
                                    <label>نام کسب‌وکار</label>
                                    <input type="text" id="specialBusinessName" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>نرخ کارمزد (%)</label>
                                    <input type="number" id="specialRate" class="form-control" step="0.5">
                                </div>
                                <div class="form-group">
                                    <label>انقضا (اختیاری)</label>
                                    <input type="date" id="specialExpiry" class="form-control">
                                </div>
                            </div>
                            <button class="btn btn-primary" id="addSpecialRateBtn">افزودن نرخ ویژه</button>
                        </div>
                        
                        <div class="special-rates-list">
                            <h4>نرخ‌های ویژه فعلی</h4>
                            ${Object.entries(this.commissionSettings.specialRates).map(([id, data]) => `
                                <div class="special-row">
                                    <span><strong>${data.name}</strong> (${id})</span>
                                    <span>${data.rate}%</span>
                                    <span>${data.expiresAt ? 'تا ' + this.formatDate(data.expiresAt) : 'نامحدود'}</span>
                                    <button class="icon-btn delete-special" data-id="${id}">🗑️</button>
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
        
        // ذخیره تنظیمات
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            const defaultRate = parseFloat(document.getElementById('defaultRate')?.value);
            const minCommission = parseInt(document.getElementById('minCommission')?.value);
            const maxCommission = parseInt(document.getElementById('maxCommission')?.value);
            
            if (!isNaN(defaultRate)) this.updateCommissionRate('default', defaultRate);
            if (!isNaN(minCommission)) this.updateCommissionRate('min', minCommission);
            if (!isNaN(maxCommission)) this.updateCommissionRate('max', maxCommission);
        });
        
        // ذخیره نرخ دسته‌بندی
        document.getElementById('saveCategoryRatesBtn')?.addEventListener('click', () => {
            const newRates = {};
            document.querySelectorAll('.category-rate-input').forEach(input => {
                const category = input.dataset.category;
                const rate = parseFloat(input.value);
                if (!isNaN(rate)) {
                    newRates[category] = rate;
                }
            });
            this.updateCommissionRate('category', newRates);
        });
        
        // افزودن نرخ ویژه
        document.getElementById('addSpecialRateBtn')?.addEventListener('click', () => {
            const businessId = document.getElementById('specialBusinessId')?.value;
            const name = document.getElementById('specialBusinessName')?.value;
            const rate = parseFloat(document.getElementById('specialRate')?.value);
            const expiry = document.getElementById('specialExpiry')?.value;
            
            if (businessId && name && !isNaN(rate)) {
                this.addSpecialRate(businessId, rate, name, expiry || null);
                modal.remove();
                setTimeout(() => this.showCommissionModal(), 100);
            } else {
                App.showToast('لطفاً تمام فیلدها را پر کنید', 'error');
            }
        });
        
        // حذف نرخ ویژه
        document.querySelectorAll('.delete-special').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const businessId = e.target.dataset.id;
                if (confirm('آیا از حذف این نرخ ویژه مطمئن هستید؟')) {
                    this.removeSpecialRate(businessId);
                    modal.remove();
                    setTimeout(() => this.showCommissionModal(), 100);
                }
            });
        });
        
        // جستجو در تاریخچه
        const historySearch = document.getElementById('historySearch');
        const historyStatus = document.getElementById('historyStatus');
        
        const filterHistory = () => {
            const search = historySearch?.value.toLowerCase() || '';
            const status = historyStatus?.value;
            
            let filtered = this.commissionHistory;
            
            if (search) {
                filtered = filtered.filter(c => 
                    c.businessId?.toLowerCase().includes(search)
                );
            }
            
            if (status !== 'all') {
                filtered = filtered.filter(c => c.status === status);
            }
            
            const historyList = document.querySelector('#historyTab .history-list');
            if (historyList) {
                historyList.innerHTML = this.renderHistoryList(filtered);
                this.attachHistoryActions();
            }
        };
        
        historySearch?.addEventListener('input', filterHistory);
        historyStatus?.addEventListener('change', filterHistory);
        
        this.attachHistoryActions();
    },
    
    // ===== رندر لیست تاریخچه =====
    renderHistoryList: function(history = null) {
        const items = history || this.commissionHistory;
        
        if (items.length === 0) {
            return '<div class="empty-state">هیچ کارمزدی ثبت نشده است</div>';
        }
        
        return `
            <div class="history-table">
                <div class="table-header">
                    <span>کسب‌وکار</span>
                    <span>مبلغ</span>
                    <span>کارمزد</span>
                    <span>خالص</span>
                    <span>نرخ</span>
                    <span>وضعیت</span>
                    <span>تاریخ</span>
                    <span></span>
                </div>
                ${items.map(c => `
                    <div class="table-row" data-id="${c.id}">
                        <span>${c.businessId || '-'}</span>
                        <span>${this.formatPrice(c.amount)}</span>
                        <span>${this.formatPrice(c.commission)}</span>
                        <span>${this.formatPrice(c.netAmount)}</span>
                        <span>${c.commissionRate || '-'}%</span>
                        <span class="commission-status ${c.status}">${c.status === 'pending' ? 'در انتظار' : 'تسویه شده'}</span>
                        <span>${this.formatDate(c.createdAt)}</span>
                        <span>
                            ${c.status === 'pending' ? 
                                `<button class="icon-btn settle-commission" data-id="${c.id}" title="تسویه">💰</button>` : ''}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    // ===== رندر لیست تسویه‌ها =====
    renderSettlementsList: function() {
        if (this.settlements.length === 0) {
            return '<div class="empty-state">هیچ تسویه‌ای انجام نشده است</div>';
        }
        
        return `
            <div class="settlements-table">
                <div class="table-header">
                    <span>کد تسویه</span>
                    <span>کسب‌وکار</span>
                    <span>مبلغ</span>
                    <span>روش پرداخت</span>
                    <span>تاریخ</span>
                </div>
                ${this.settlements.map(s => `
                    <div class="table-row">
                        <span>${s.id}</span>
                        <span>${s.businessId || '-'}</span>
                        <span class="settlement-amount">${this.formatPrice(s.totalAmount)}</span>
                        <span>${this.getPaymentMethodName(s.paymentMethod)}</span>
                        <span>${this.formatDate(s.createdAt)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    // ===== اتصال دکمه‌های تسویه =====
    attachHistoryActions: function() {
        document.querySelectorAll('.settle-commission').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commissionId = e.target.dataset.id;
                const commission = this.commissionHistory.find(c => c.id === commissionId);
                if (commission) {
                    this.settleCommission({ commissionIds: [commissionId], businessId: commission.businessId });
                    setTimeout(() => {
                        const modal = document.getElementById('commissionModal');
                        if (modal) {
                            modal.remove();
                            this.showCommissionModal();
                        }
                    }, 500);
                }
            });
        });
    },
    
    // ===== توابع کمکی =====
    getCategoryName: function(category) {
        const names = {
            'beauty': 'آرایشی و زیبایی',
            'medical': 'پزشکی و درمانی',
            'sports': 'ورزشی',
            'education': 'آموزشی'
        };
        return names[category] || category;
    },
    
    getPaymentMethodName: function(method) {
        const names = {
            'bank_transfer': 'انتقال بانکی',
            'card': 'کارت به کارت',
            'cash': 'نقدی'
        };
        return names[method] || method;
    },
    
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    },
    
    formatDate: function(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fa-IR');
    }
};

// استایل‌های مدیریت کارمزد
const commissionStyles = `
<style>
.commission-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
    flex-wrap: wrap;
}

.settings-form {
    max-width: 400px;
    margin-bottom: 30px;
}

.category-rates-list {
    margin: 15px 0;
}

.category-row {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 8px;
    border-bottom: 1px solid var(--border-color);
}

.category-row span:first-child {
    width: 150px;
}

.history-filters {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.history-table, .settlements-table {
    margin-top: 15px;
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
}

.commission-status {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.commission-status.pending {
    background: var(--color-warning-soft);
    color: var(--color-warning);
}

.commission-status.settled {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.settlement-amount {
    color: var(--color-primary);
    font-weight: bold;
}

.special-rates-form {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
}

.special-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid var(--border-color);
}
</style>
`;

if (!document.querySelector('#commission-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'commission-styles';
    styleSheet.textContent = commissionStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    CommissionManager.init();
});

window.CommissionManager = CommissionManager;
