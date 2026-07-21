 /* ============================================
   LOYALTY-DISCOUNT.JS - تخفیف وفاداری
   ============================================ */

const LoyaltyDiscount = {
    // سطوح وفاداری
    tiers: {
        bronze: {
            name: 'برنزی',
            minPoints: 0,
            discountPercent: 5,
            icon: '🥉',
            color: '#CD7F32'
        },
        silver: {
            name: 'نقره‌ای',
            minPoints: 100,
            discountPercent: 10,
            icon: '🥈',
            color: '#C0C0C0'
        },
        gold: {
            name: 'طلایی',
            minPoints: 300,
            discountPercent: 15,
            icon: '🥇',
            color: '#FFD700'
        },
        platinum: {
            name: 'پلاتینیوم',
            minPoints: 600,
            discountPercent: 20,
            icon: '💎',
            color: '#E5E4E2'
        },
        diamond: {
            name: 'الماس',
            minPoints: 1000,
            discountPercent: 25,
            icon: '💎✨',
            color: '#B9F2FF'
        }
    },
    
    // امتیازدهی بر اساس عملیات
    pointRules: {
        registration: 100,
        booking: 50,
        review: 20,
        referral: 200,
        birthday: 50,
        firstBooking: 100
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('⭐ سیستم تخفیف وفاداری راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on(SystemEvents.AUTH_LOGIN, (data) => {
            this.loadUserLoyalty(data.user);
        });
        
        App.on(SystemEvents.BOOKING_CREATED, (data) => {
            this.addPoints(data.customer.phone, 'booking', data.finalPrice);
        });
        
        App.on('review:submitted', (data) => {
            this.addPoints(data.userPhone, 'review');
        });
        
        App.on('referral:used', (data) => {
            this.addPoints(data.referrerPhone, 'referral');
        });
    },
    
    // ===== بارگذاری اطلاعات وفاداری کاربر =====
    loadUserLoyalty: function(user) {
        if (!user || !user.phone) return;
        
        const loyaltyData = localStorage.getItem(`loyalty_${user.phone}`);
        if (loyaltyData) {
            try {
                user.loyalty = JSON.parse(loyaltyData);
                user.loyaltyTier = this.getTierByPoints(user.loyalty.points);
            } catch(e) {
                this.createUserLoyalty(user);
            }
        } else {
            this.createUserLoyalty(user);
        }
        
        StateManager.set('user', user);
    },
    
    // ===== ایجاد سابقه وفاداری برای کاربر جدید =====
    createUserLoyalty: function(user) {
        const loyalty = {
            points: 0,
            totalPointsEarned: 0,
            totalDiscountReceived: 0,
            tier: 'bronze',
            history: [],
            createdAt: new Date().toISOString()
        };
        
        user.loyalty = loyalty;
        user.loyaltyTier = 'bronze';
        
        localStorage.setItem(`loyalty_${user.phone}`, JSON.stringify(loyalty));
        
        // امتیاز ثبت‌نام
        this.addPoints(user.phone, 'registration');
    },
    
    // ===== دریافت سطح بر اساس امتیاز =====
    getTierByPoints: function(points) {
        const tiers = Object.entries(this.tiers);
        let currentTier = tiers[0][1];
        
        for (const [key, tier] of tiers) {
            if (points >= tier.minPoints) {
                currentTier = tier;
            }
        }
        
        return currentTier.name === 'برنزی' ? 'bronze' : 
               currentTier.name === 'نقره‌ای' ? 'silver' :
               currentTier.name === 'طلایی' ? 'gold' :
               currentTier.name === 'پلاتینیوم' ? 'platinum' : 'diamond';
    },
    
    // ===== افزودن امتیاز =====
    addPoints: function(userPhone, action, amount = null) {
        const loyaltyData = localStorage.getItem(`loyalty_${userPhone}`);
        if (!loyaltyData) return;
        
        const loyalty = JSON.parse(loyaltyData);
        let points = this.pointRules[action] || 0;
        
        // امتیاز ویژه برای نوبت
        if (action === 'booking' && amount) {
            points = Math.floor(amount / 10000); // هر 10 هزار تومان = 1 امتیاز
        }
        
        loyalty.points += points;
        loyalty.totalPointsEarned += points;
        loyalty.history.push({
            action: action,
            points: points,
            date: new Date().toISOString()
        });
        
        // بررسی ارتقای سطح
        const newTier = this.getTierByPoints(loyalty.points);
        if (newTier !== loyalty.tier) {
            loyalty.tier = newTier;
            this.onTierUpgrade(userPhone, newTier);
        }
        
        localStorage.setItem(`loyalty_${userPhone}`, JSON.stringify(loyalty));
        
        // به‌روزرسانی state
        const user = AuthSession.getUser();
        if (user && user.phone === userPhone) {
            user.loyalty = loyalty;
            user.loyaltyTier = newTier;
            StateManager.set('user', user);
        }
        
        App.emit('loyalty:points-added', { userPhone, points, total: loyalty.points });
        
        if (points > 0) {
            App.showToast(`✨ ${points} امتیاز به حساب شما اضافه شد! مجموع امتیاز: ${loyalty.points}`, 'success');
        }
        
        return points;
    },
    
    // ===== رویداد ارتقای سطح =====
    onTierUpgrade: function(userPhone, newTier) {
        const tierInfo = this.tiers[newTier];
        App.showToast(`🎉 تبریک! شما به سطح ${tierInfo.name} ${tierInfo.icon} ارتقا یافتید! تخفیف شما به ${tierInfo.discountPercent}٪ افزایش یافت.`, 'success');
        
        App.emit('loyalty:tier-upgraded', { userPhone, newTier });
    },
    
    // ===== محاسبه تخفیف وفاداری =====
    calculateLoyaltyDiscount: function(userId, amount) {
        const user = AuthSession.getUser();
        if (!user || !user.loyaltyTier) return { amount: 0, percent: 0, name: null };
        
        const tierInfo = this.tiers[user.loyaltyTier];
        if (!tierInfo) return { amount: 0, percent: 0, name: null };
        
        const discountPercent = tierInfo.discountPercent;
        let discountAmount = (amount * discountPercent) / 100;
        
        // محدودیت حداکثر تخفیف ۳۰٪
        const maxDiscount = (amount * 30) / 100;
        if (discountAmount > maxDiscount) {
            discountAmount = maxDiscount;
        }
        
        return {
            amount: discountAmount,
            percent: discountPercent,
            name: `تخفیف سطح ${tierInfo.name} ${tierInfo.icon}`
        };
    },
    
    // ===== دریافت امتیاز کاربر =====
    getUserPoints: function(userPhone) {
        const loyaltyData = localStorage.getItem(`loyalty_${userPhone}`);
        if (!loyaltyData) return 0;
        return JSON.parse(loyaltyData).points;
    },
    
    // ===== دریافت اطلاعات کامل وفاداری =====
    getUserLoyaltyInfo: function(userPhone) {
        const loyaltyData = localStorage.getItem(`loyalty_${userPhone}`);
        if (!loyaltyData) return null;
        return JSON.parse(loyaltyData);
    },
    
    // ===== دریافت امتیاز لازم برای سطح بعدی =====
    getPointsToNextTier: function(currentPoints) {
        const tiers = Object.entries(this.tiers);
        let nextTier = null;
        
        for (const [key, tier] of tiers) {
            if (tier.minPoints > currentPoints) {
                nextTier = { key, ...tier };
                break;
            }
        }
        
        if (nextTier) {
            return {
                needed: nextTier.minPoints - currentPoints,
                tierName: nextTier.name,
                tierIcon: nextTier.icon
            };
        }
        
        return null;
    },
    
    // ===== نمایش مودال باشگاه وفاداری =====
    showLoyaltyModal: function() {
        const user = AuthSession.getUser();
        if (!user) {
            App.showToast('لطفاً ابتدا وارد شوید', 'warning');
            return;
        }
        
        const loyalty = this.getUserLoyaltyInfo(user.phone);
        const tierInfo = this.tiers[user.loyaltyTier];
        const nextTier = this.getPointsToNextTier(loyalty?.points || 0);
        
        const modal = document.createElement('div');
        modal.id = 'loyaltyModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>⭐ باشگاه وفاداری ${tierInfo.icon}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="loyalty-header" style="background: ${tierInfo.color}20; border-color: ${tierInfo.color}">
                        <div class="tier-info">
                            <span class="tier-icon">${tierInfo.icon}</span>
                            <div>
                                <div class="tier-name">سطح ${tierInfo.name}</div>
                                <div class="tier-discount">تخفیف ${tierInfo.discountPercent}٪</div>
                            </div>
                        </div>
                        <div class="points-info">
                            <div class="points-value">${loyalty?.points || 0}</div>
                            <div class="points-label">امتیاز شما</div>
                        </div>
                    </div>
                    
                    ${nextTier ? `
                        <div class="next-tier-progress">
                            <div class="progress-label">
                                <span>امتیاز لازم برای سطح ${nextTier.tierName} ${nextTier.tierIcon}</span>
                                <span>${nextTier.needed} امتیاز مانده</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(100, (loyalty?.points || 0) / (loyalty?.points + nextTier.needed) * 100)}%"></div>
                            </div>
                        </div>
                    ` : '<div class="max-tier">🎉 شما به بالاترین سطح وفاداری رسیده‌اید!</div>'}
                    
                    <div class="point-rules">
                        <h4>✨ چگونه امتیاز بگیریم؟</h4>
                        <div class="rules-grid">
                            <div class="rule-item">📝 ثبت‌نام: ${this.pointRules.registration} امتیاز</div>
                            <div class="rule-item">📅 هر نوبت: ۵۰ امتیاز + ۱ امتیاز به ازای هر ۱۰ هزار تومان</div>
                            <div class="rule-item">⭐ نظر دادن: ${this.pointRules.review} امتیاز</div>
                            <div class="rule-item">👥 معرفی دوست: ${this.pointRules.referral} امتیاز</div>
                            <div class="rule-item">🎂 تولد: ${this.pointRules.birthday} امتیاز</div>
                            <div class="rule-item">🎁 اولین نوبت: ${this.pointRules.firstBooking} امتیاز</div>
                        </div>
                    </div>
                    
                    <div class="loyalty-history">
                        <h4>📜 تاریخچه امتیازات</h4>
                        <div class="history-list">
                            ${loyalty?.history?.slice(-10).reverse().map(h => `
                                <div class="history-item">
                                    <span class="history-action">${this.getActionLabel(h.action)}</span>
                                    <span class="history-points ${h.points > 0 ? 'positive' : 'negative'}">${h.points > 0 ? '+' : ''}${h.points}</span>
                                    <span class="history-date">${new Date(h.date).toLocaleDateString('fa-IR')}</span>
                                </div>
                            `).join('') || '<div class="text-center">هنوز امتیازی کسب نکرده‌اید</div>'}
                        </div>
                    </div>
                    
                    <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">متوجه شدم</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    },
    
    // ===== دریافت عنوان عملیات =====
    getActionLabel: function(action) {
        const labels = {
            registration: 'ثبت‌نام',
            booking: 'رزرو نوبت',
            review: 'نظر دادن',
            referral: 'معرفی دوست',
            birthday: 'تولد مبارک',
            firstBooking: 'اولین نوبت'
        };
        return labels[action] || action;
    }
};

// استایل‌های باشگاه وفاداری
const loyaltyStyles = `
<style>
.loyalty-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-radius: var(--radius-lg);
    margin-bottom: 20px;
}

.tier-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.tier-icon {
    font-size: 48px;
}

.tier-name {
    font-size: 18px;
    font-weight: bold;
}

.tier-discount {
    font-size: 14px;
    color: var(--text-secondary);
}

.points-info {
    text-align: center;
}

.points-value {
    font-size: 32px;
    font-weight: bold;
    color: var(--color-primary);
}

.points-label {
    font-size: 12px;
    color: var(--text-tertiary);
}

.next-tier-progress {
    margin-bottom: 20px;
}

.progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 8px;
}

.progress-bar {
    height: 8px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
    border-radius: var(--radius-full);
    transition: width 0.3s;
}

.max-tier {
    text-align: center;
    padding: 15px;
    background: var(--color-success-soft);
    border-radius: var(--radius-md);
    color: var(--color-success);
    margin-bottom: 20px;
}

.point-rules {
    margin-bottom: 20px;
}

.rules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    margin-top: 10px;
}

.rule-item {
    padding: 8px;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    font-size: 13px;
}

.loyalty-history {
    margin-bottom: 20px;
}

.history-list {
    max-height: 200px;
    overflow-y: auto;
    margin-top: 10px;
}

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid var(--border-color);
}

.history-action {
    flex: 1;
}

.history-points {
    font-weight: bold;
    margin: 0 15px;
}

.history-points.positive {
    color: var(--color-success);
}

.history-points.negative {
    color: var(--color-danger);
}

.history-date {
    font-size: 11px;
    color: var(--text-tertiary);
}
</style>
`;

if (!document.querySelector('#loyalty-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'loyalty-styles';
    styleSheet.textContent = loyaltyStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    LoyaltyDiscount.init();
});

window.LoyaltyDiscount = LoyaltyDiscount;
