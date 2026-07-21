 /* ============================================
   SUBSIDY-POOL.JS - صندوق یارانه تخفیف
   ============================================ */

const SubsidyPool = {
    // صندوق یارانه
    pool: {
        balance: 0,
        totalContributed: 0,
        totalSubsidized: 0,
        transactions: [],
        lastUpdate: null
    },
    
    // نرخ مشارکت از کارمزدها (۱۵٪)
    contributionRate: 15,
    
    // حداکثر یارانه برای هر تخفیف
    maxSubsidyPerDiscount: 100000,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadPool();
        this.attachEvents();
        console.log('💰 صندوق یارانه تخفیف راه‌اندازی شد');
    },
    
    // ===== بارگذاری صندوق =====
    loadPool: function() {
        const saved = localStorage.getItem('subsidy_pool');
        if (saved) {
            try {
                this.pool = JSON.parse(saved);
            } catch(e) {
                this.initializePool();
            }
        } else {
            this.initializePool();
        }
    },
    
    // ===== مقداردهی اولیه صندوق =====
    initializePool: function() {
        this.pool = {
            balance: 0,
            totalContributed: 0,
            totalSubsidized: 0,
            transactions: [],
            lastUpdate: new Date().toISOString()
        };
        this.savePool();
    },
    
    // ===== ذخیره صندوق =====
    savePool: function() {
        this.pool.lastUpdate = new Date().toISOString();
        localStorage.setItem('subsidy_pool', JSON.stringify(this.pool));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('payment:success', (data) => {
            this.addContribution(data.amount);
        });
        
        App.on('subsidy:request', (data) => {
            return this.requestSubsidy(data);
        });
    },
    
    // ===== افزودن مشارکت از کارمزد =====
    addContribution: function(paymentAmount) {
        // محاسبه کارمزد (۳٪ از مبلغ)
        const commission = paymentAmount * 0.03;
        // مشارکت در صندوق (۱۵٪ از کارمزد)
        const contribution = (commission * this.contributionRate) / 100;
        
        this.pool.balance += contribution;
        this.pool.totalContributed += contribution;
        
        this.pool.transactions.push({
            id: 'CTR' + Date.now() + Math.random().toString(36).substr(2, 8),
            type: 'contribution',
            amount: contribution,
            paymentAmount: paymentAmount,
            commission: commission,
            date: new Date().toISOString()
        });
        
        this.savePool();
        
        App.emit('subsidy:contribution-added', { amount: contribution, newBalance: this.pool.balance });
        console.log(`💰 ${this.formatPrice(contribution)} به صندوق یارانه اضافه شد. موجودی: ${this.formatPrice(this.pool.balance)}`);
    },
    
    // ===== درخواست یارانه برای تخفیف =====
    requestSubsidy: function(data) {
        const { discountAmount, businessId, customerTier, bookingAmount } = data;
        
        // محاسبه سهم پلتفرم و کسب‌وکار
        const subsidyInfo = this.calculateSubsidySplit(discountAmount, businessId, customerTier);
        
        if (subsidyInfo.platformShare > this.pool.balance) {
            return {
                success: false,
                message: 'موجودی صندوق یارانه کافی نیست',
                platformShare: 0,
                businessShare: subsidyInfo.businessShare,
                discountAmount: discountAmount
            };
        }
        
        // کسر از صندوق
        this.pool.balance -= subsidyInfo.platformShare;
        this.pool.totalSubsidized += subsidyInfo.platformShare;
        
        this.pool.transactions.push({
            id: 'SBS' + Date.now() + Math.random().toString(36).substr(2, 8),
            type: 'subsidy',
            amount: subsidyInfo.platformShare,
            discountAmount: discountAmount,
            businessId: businessId,
            customerTier: customerTier,
            bookingAmount: bookingAmount,
            date: new Date().toISOString()
        });
        
        this.savePool();
        
        App.emit('subsidy:granted', subsidyInfo);
        
        return {
            success: true,
            platformShare: subsidyInfo.platformShare,
            businessShare: subsidyInfo.businessShare,
            discountAmount: discountAmount
        };
    },
    
    // ===== محاسبه سهم یارانه =====
    calculateSubsidySplit: function(discountAmount, businessId, customerTier) {
        const discountPercent = (discountAmount / 1000); // نسبت تخفیف به مبلغ (مقدار فرضی)
        
        let platformPercent = 50; // سهم پیش‌فرض پلتفرم
        let businessPercent = 50; // سهم پیش‌فرض کسب‌وکار
        
        // بر اساس سطح مشتری
        const tierRates = {
            'bronze': { platform: 60, business: 40 },
            'silver': { platform: 55, business: 45 },
            'gold': { platform: 50, business: 50 },
            'platinum': { platform: 45, business: 55 },
            'diamond': { platform: 40, business: 60 }
        };
        
        if (customerTier && tierRates[customerTier]) {
            platformPercent = tierRates[customerTier].platform;
            businessPercent = tierRates[customerTier].business;
        }
        
        // محدودیت حداکثر یارانه
        let platformShare = (discountAmount * platformPercent) / 100;
        if (platformShare > this.maxSubsidyPerDiscount) {
            platformShare = this.maxSubsidyPerDiscount;
            businessPercent = discountAmount - platformShare;
        }
        
        const businessShare = discountAmount - platformShare;
        
        return {
            platformShare: platformShare,
            businessShare: businessShare,
            platformPercent: platformPercent,
            businessPercent: businessPercent
        };
    },
    
    // ===== دریافت موجودی صندوق =====
    getPoolBalance: function() {
        return this.pool.balance;
    },
    
    // ===== دریافت آمار صندوق =====
    getPoolStats: function() {
        return {
            balance: this.pool.balance,
            totalContributed: this.pool.totalContributed,
            totalSubsidized: this.pool.totalSubsidized,
            efficiency: this.pool.totalContributed > 0 ? 
                (this.pool.totalSubsidized / this.pool.totalContributed) * 100 : 0,
            transactionCount: this.pool.transactions.length
        };
    },
    
    // ===== دریافت تاریخچه تراکنش‌ها =====
    getTransactionHistory: function(limit = 20) {
        return this.pool.transactions.slice(0, limit);
    },
    
    // ===== شارژ دستی صندوق (برای ادمین) =====
    manualAddFunds: function(amount, reason) {
        if (amount <= 0) return false;
        
        this.pool.balance += amount;
        this.pool.totalContributed += amount;
        
        this.pool.transactions.push({
            id: 'MAN' + Date.now() + Math.random().toString(36).substr(2, 8),
            type: 'manual',
            amount: amount,
            reason: reason || 'شارژ دستی',
            date: new Date().toISOString()
        });
        
        this.savePool();
        
        App.showToast(`مبلغ ${this.formatPrice(amount)} به صندوق یارانه اضافه شد`, 'success');
        App.emit('subsidy:manual-add', { amount, reason });
        
        return true;
    },
    
    // ===== نمایش مودال آمار صندوق =====
    showPoolStatsModal: function() {
        const stats = this.getPoolStats();
        
        const modal = document.createElement('div');
        modal.id = 'subsidyPoolModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>💰 صندوق یارانه تخفیف</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="pool-stats">
                        <div class="stat-card">
                            <div class="stat-value">${this.formatPrice(stats.balance)}</div>
                            <div class="stat-label">موجودی فعلی</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.formatPrice(stats.totalContributed)}</div>
                            <div class="stat-label">مجموع مشارکت‌ها</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.formatPrice(stats.totalSubsidized)}</div>
                            <div class="stat-label">مجموع یارانه‌ها</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.efficiency.toFixed(1)}%</div>
                            <div class="stat-label">بازدهی صندوق</div>
                        </div>
                    </div>
                    
                    <div class="pool-info">
                        <h4>📊 نحوه عملکرد صندوق:</h4>
                        <ul>
                            <li>💰 ${this.contributionRate}٪ از کارمزد پلتفرم به صندوق واریز می‌شود</li>
                            <li>🎁 صندوق برای تأمین بخشی از تخفیف‌های کاربران استفاده می‌شود</li>
                            <li>👑 کاربران وفادار سهم بیشتری از صندوق دریافت می‌کنند</li>
                            <li>📈 بازدهی صندوق نشان‌دهنده کارایی یارانه‌هاست</li>
                        </ul>
                    </div>
                    
                    <div class="recent-transactions">
                        <h4>📜 آخرین تراکنش‌ها</h4>
                        <div class="transactions-list">
                            ${this.getTransactionHistory(5).map(t => `
                                <div class="transaction-row">
                                    <span class="transaction-type ${t.type}">
                                        ${t.type === 'contribution' ? '➕ مشارکت' : t.type === 'subsidy' ? '➖ یارانه' : '🔧 شارژ دستی'}
                                    </span>
                                    <span class="transaction-amount ${t.type === 'contribution' ? 'positive' : 'negative'}">
                                        ${t.type === 'contribution' ? '+' : '-'} ${this.formatPrice(t.amount)}
                                    </span>
                                    <span class="transaction-date">${new Date(t.date).toLocaleDateString('fa-IR')}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

// استایل‌های صندوق یارانه
const subsidyStyles = `
<style>
.pool-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 25px;
}

.pool-stats .stat-card {
    text-align: center;
    padding: 15px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: var(--radius-lg);
    color: white;
}

.pool-stats .stat-value {
    font-size: 24px;
    font-weight: bold;
}

.pool-stats .stat-label {
    font-size: 12px;
    opacity: 0.9;
    margin-top: 5px;
}

.pool-info {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
}

.pool-info h4 {
    margin-bottom: 10px;
}

.pool-info ul {
    padding-right: 20px;
}

.pool-info li {
    margin-bottom: 8px;
    font-size: 13px;
}

.recent-transactions {
    margin-bottom: 20px;
}

.transactions-list {
    max-height: 200px;
    overflow-y: auto;
    margin-top: 10px;
}

.transaction-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid var(--border-color);
}

.transaction-type {
    font-size: 13px;
}

.transaction-type.contribution {
    color: var(--color-success);
}

.transaction-type.subsidy {
    color: var(--color-warning);
}

.transaction-type.manual {
    color: var(--color-info);
}

.transaction-amount {
    font-weight: bold;
}

.transaction-amount.positive {
    color: var(--color-success);
}

.transaction-amount.negative {
    color: var(--color-danger);
}

.transaction-date {
    font-size: 11px;
    color: var(--text-tertiary);
}
</style>
`;

if (!document.querySelector('#subsidy-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'subsidy-styles';
    styleSheet.textContent = subsidyStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    SubsidyPool.init();
});

window.SubsidyPool = SubsidyPool;
