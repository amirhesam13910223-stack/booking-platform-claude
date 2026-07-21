 /* ============================================
   WALLET.JS - کیف پول دیجیتال
   ============================================ */

const WalletSystem = {
    // کیف پول کاربر فعلی
    currentWallet: null,
    
    // تاریخچه تراکنش‌ها
    transactions: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadWallet();
        this.attachEvents();
        console.log('👛 ماژول WalletSystem راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on(SystemEvents.AUTH_LOGIN, () => {
            this.loadWallet();
        });
        
        App.on('wallet:charge', (data) => {
            this.chargeWallet(data);
        });
        
        App.on('wallet:withdraw', (data) => {
            this.withdrawFromWallet(data);
        });
    },
    
    // ===== بارگذاری کیف پول =====
    loadWallet: function() {
        const user = AuthSession.getUser();
        if (!user) {
            this.currentWallet = null;
            return;
        }
        
        const saved = localStorage.getItem(`wallet_${user.id}`);
        if (saved) {
            try {
                this.currentWallet = JSON.parse(saved);
                this.transactions = this.currentWallet.transactions || [];
            } catch(e) {
                this.createNewWallet();
            }
        } else {
            this.createNewWallet();
        }
    },
    
    // ===== ایجاد کیف پول جدید =====
    createNewWallet: function() {
        const user = AuthSession.getUser();
        if (!user) return;
        
        this.currentWallet = {
            userId: user.id,
            balance: 0,
            transactions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.transactions = [];
        this.saveWallet();
    },
    
    // ===== ذخیره کیف پول =====
    saveWallet: function() {
        if (this.currentWallet) {
            this.currentWallet.transactions = this.transactions;
            this.currentWallet.updatedAt = new Date().toISOString();
            localStorage.setItem(`wallet_${this.currentWallet.userId}`, JSON.stringify(this.currentWallet));
        }
    },
    
    // ===== دریافت موجودی =====
    getBalance: function() {
        return this.currentWallet ? this.currentWallet.balance : 0;
    },
    
    // ===== شارژ کیف پول =====
    chargeWallet: async function(data) {
        const { amount, callback } = data;
        
        if (!amount || amount <= 0) {
            App.showToast('مبلغ نامعتبر است', 'error');
            return;
        }
        
        // نمایش مودال انتخاب درگاه
        this.showChargeModal(amount, callback);
    },
    
    // ===== نمایش مودال شارژ =====
    showChargeModal: function(amount, callback) {
        const modal = document.createElement('div');
        modal.id = 'chargeModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💰 شارژ کیف پول</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="wallet-info">
                        <p>موجودی فعلی: <strong>${this.formatPrice(this.getBalance())}</strong></p>
                        <p>مبلغ شارژ: <strong class="charge-amount">${this.formatPrice(amount)}</strong></p>
                        <p>موجودی پس از شارژ: <strong>${this.formatPrice(this.getBalance() + amount)}</strong></p>
                    </div>
                    
                    <div class="form-group">
                        <label>انتخاب درگاه پرداخت</label>
                        <select id="chargeGateway" class="form-control">
                            ${PaymentGatewayHandler.getGateways().map(g => `<option value="${g.id}">${g.icon} ${g.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                        <button class="btn btn-primary" id="confirmChargeBtn">پرداخت و شارژ</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('confirmChargeBtn')?.addEventListener('click', async () => {
            const gateway = document.getElementById('chargeGateway')?.value;
            
            const paymentResult = await PaymentGatewayHandler.processPayment({
                amount: amount,
                description: `شارژ کیف پول به مبلغ ${this.formatPrice(amount)}`,
                gateway: gateway,
                callback: (transaction) => {
                    this.onChargeSuccess(amount, transaction, callback);
                }
            });
            
            if (!paymentResult) {
                App.showToast('خطا در اتصال به درگاه پرداخت', 'error');
            }
            
            modal.remove();
            document.body.style.overflow = '';
        });
    },
    
    // ===== موفقیت در شارژ =====
    onChargeSuccess: function(amount, transaction, callback) {
        // اضافه کردن به موجودی
        this.currentWallet.balance += amount;
        
        // ثبت تراکنش
        const walletTransaction = {
            id: 'WLT' + Date.now() + Math.floor(Math.random() * 10000),
            type: 'charge',
            amount: amount,
            status: 'success',
            paymentTransactionId: transaction.id,
            description: `شارژ کیف پول`,
            createdAt: new Date().toISOString()
        };
        
        this.transactions.unshift(walletTransaction);
        this.saveWallet();
        
        App.showToast(`کیف پول شما با موفقیت به مبلغ ${this.formatPrice(amount)} شارژ شد`, 'success');
        
        if (callback) {
            callback(this.currentWallet);
        }
        
        App.emit('wallet:updated', this.currentWallet);
    },
    
    // ===== برداشت از کیف پول =====
    withdrawFromWallet: function(data) {
        const { amount, description, callback } = data;
        
        if (!amount || amount <= 0) {
            App.showToast('مبلغ نامعتبر است', 'error');
            return false;
        }
        
        if (amount > this.getBalance()) {
            App.showToast('موجودی کیف پول کافی نیست', 'error');
            return false;
        }
        
        // کسر از موجودی
        this.currentWallet.balance -= amount;
        
        // ثبت تراکنش
        const walletTransaction = {
            id: 'WLT' + Date.now() + Math.floor(Math.random() * 10000),
            type: 'withdraw',
            amount: amount,
            status: 'success',
            description: description || 'برداشت از کیف پول',
            createdAt: new Date().toISOString()
        };
        
        this.transactions.unshift(walletTransaction);
        this.saveWallet();
        
        App.showToast(`مبلغ ${this.formatPrice(amount)} از کیف پول شما کسر شد`, 'info');
        
        if (callback) {
            callback(this.currentWallet);
        }
        
        App.emit('wallet:updated', this.currentWallet);
        return true;
    },
    
    // ===== پرداخت با کیف پول =====
    payWithWallet: function(amount, description) {
        if (amount > this.getBalance()) {
            App.showToast('موجودی کیف پول کافی نیست', 'error');
            return false;
        }
        
        this.withdrawFromWallet({
            amount: amount,
            description: description,
            callback: () => {
                App.showToast(`پرداخت ${this.formatPrice(amount)} با کیف پول انجام شد`, 'success');
            }
        });
        
        return true;
    },
    
    // ===== دریافت تاریخچه تراکنش‌ها =====
    getTransactions: function(limit = 20) {
        return this.transactions.slice(0, limit);
    },
    
    // ===== نمایش مودال کیف پول =====
    showWalletModal: function() {
        const modal = document.createElement('div');
        modal.id = 'walletModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>👛 کیف پول من</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="wallet-balance">
                        <span class="balance-label">موجودی فعلی:</span>
                        <span class="balance-amount">${this.formatPrice(this.getBalance())}</span>
                    </div>
                    
                    <div class="wallet-actions">
                        <button class="btn btn-primary" id="walletChargeBtn">💳 شارژ کیف پول</button>
                        <button class="btn btn-outline" id="walletHistoryBtn">📜 تاریخچه تراکنش‌ها</button>
                    </div>
                    
                    <div id="walletHistoryContainer" style="display: none;">
                        <h4>تاریخچه تراکنش‌ها</h4>
                        <div class="transactions-list">
                            ${this.transactions.length === 0 ? '<p class="text-center">هیچ تراکنشی یافت نشد</p>' : 
                                this.transactions.slice(0, 10).map(t => `
                                    <div class="transaction-item ${t.type}">
                                        <div class="transaction-info">
                                            <span class="transaction-icon">${t.type === 'charge' ? '💰' : '💸'}</span>
                                            <div class="transaction-details">
                                                <span class="transaction-desc">${t.description}</span>
                                                <span class="transaction-date">${new Date(t.createdAt).toLocaleDateString('fa-IR')}</span>
                                            </div>
                                        </div>
                                        <span class="transaction-amount ${t.type === 'charge' ? 'positive' : 'negative'}">
                                            ${t.type === 'charge' ? '+' : '-'} ${this.formatPrice(t.amount)}
                                        </span>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('walletChargeBtn')?.addEventListener('click', () => {
            const amount = prompt('مبلغ شارژ را وارد کنید (تومان):');
            if (amount && !isNaN(amount) && parseInt(amount) > 0) {
                this.chargeWallet({ amount: parseInt(amount) });
                modal.remove();
            } else {
                App.showToast('مبلغ نامعتبر است', 'error');
            }
        });
        
        document.getElementById('walletHistoryBtn')?.addEventListener('click', () => {
            const container = document.getElementById('walletHistoryContainer');
            if (container.style.display === 'none') {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
        });
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

// استایل‌های کیف پول
const walletStyles = `
<style>
.wallet-balance {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: var(--radius-lg);
    color: white;
    margin-bottom: 20px;
}

.balance-label {
    display: block;
    font-size: 14px;
    opacity: 0.9;
}

.balance-amount {
    display: block;
    font-size: 32px;
    font-weight: bold;
    margin-top: 8px;
}

.wallet-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
}

.transactions-list {
    max-height: 400px;
    overflow-y: auto;
}

.transaction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid var(--border-color);
}

.transaction-item:last-child {
    border-bottom: none;
}

.transaction-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.transaction-icon {
    font-size: 24px;
}

.transaction-details {
    display: flex;
    flex-direction: column;
}

.transaction-desc {
    font-size: 14px;
    font-weight: 500;
}

.transaction-date {
    font-size: 11px;
    color: var(--text-tertiary);
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
</style>
`;

if (!document.querySelector('#wallet-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'wallet-styles';
    styleSheet.textContent = walletStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    WalletSystem.init();
});

window.WalletSystem = WalletSystem;
