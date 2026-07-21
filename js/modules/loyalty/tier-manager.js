 /* ============================================
   TIER-MANAGER.JS - مدیریت سطوح وفاداری
   ============================================ */

const TierManager = {
    // سطوح وفاداری
    tiers: {
        bronze: {
            name: 'برنزی',
            minPoints: 0,
            discount: 5,
            icon: '🥉',
            color: '#CD7F32',
            benefits: ['تخفیف ۵٪', 'امتیاز مضاعف در مناسبت‌ها']
        },
        silver: {
            name: 'نقره‌ای',
            minPoints: 100,
            discount: 10,
            icon: '🥈',
            color: '#C0C0C0',
            benefits: ['تخفیف ۱۰٪', 'اولویت در رزرو', 'هدیه تولد']
        },
        gold: {
            name: 'طلایی',
            minPoints: 300,
            discount: 15,
            icon: '🥇',
            color: '#FFD700',
            benefits: ['تخفیف ۱۵٪', 'پشتیبانی ویژه', 'لغو رایگان']
        },
        platinum: {
            name: 'پلاتینیوم',
            minPoints: 600,
            discount: 20,
            icon: '💎',
            color: '#E5E4E2',
            benefits: ['تخفیف ۲۰٪', 'رزرو اختصاصی', 'مشاوره رایگان']
        },
        diamond: {
            name: 'الماس',
            minPoints: 1000,
            discount: 25,
            icon: '💎✨',
            color: '#B9F2FF',
            benefits: ['تخفیف ۲۵٪', 'اولویت مطلق', 'هدایای ویژه ماهانه']
        }
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('🏆 سیستم مدیریت سطوح وفاداری راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('points:added', (data) => {
            this.checkTierUpgrade(data.userId, data.total);
        });
        
        App.on('user:loaded', (data) => {
            this.updateUserTier(data.user);
        });
    },
    
    // ===== دریافت سطح بر اساس امتیاز =====
    getTierByPoints: function(points) {
        const tiers = Object.entries(this.tiers);
        let currentTier = tiers[0][1];
        
        for (const [key, tier] of tiers) {
            if (points >= tier.minPoints) {
                currentTier = { key, ...tier };
            }
        }
        
        return currentTier;
    },
    
    // ===== دریافت اطلاعات سطح =====
    getTierInfo: function(tierKey) {
        return this.tiers[tierKey];
    },
    
    // ===== بررسی ارتقای سطح =====
    checkTierUpgrade: function(userId, newPoints) {
        const newTier = this.getTierByPoints(newPoints);
        const user = StateManager.get('user');
        
        if (user && user.id === userId) {
            const oldTierKey = user.loyaltyTier || 'bronze';
            if (oldTierKey !== newTier.key) {
                this.onTierUpgrade(user, newTier);
            }
            
            user.loyaltyTier = newTier.key;
            user.loyaltyDiscount = newTier.discount;
            StateManager.set('user', user);
        }
    },
    
    // ===== رویداد ارتقای سطح =====
    onTierUpgrade: function(user, newTier) {
        App.emit('tier:upgraded', {
            userId: user.id,
            oldTier: user.loyaltyTier,
            newTier: newTier.key,
            newDiscount: newTier.discount
        });
        
        // نمایش پیام تبریک
        InAppAlert.success(
            `تبریک! شما به سطح ${newTier.name} ${newTier.icon} ارتقا یافتید. تخفیف شما به ${newTier.discount}٪ افزایش یافت.`,
            '🎉 ارتقای سطح'
        );
    },
    
    // ===== بروزرسانی سطح کاربر =====
    updateUserTier: function(user) {
        if (!user || !user.id) return;
        
        const pointsData = PointsSystem.getUserPoints(user.id);
        const tier = this.getTierByPoints(pointsData.total);
        
        user.loyaltyTier = tier.key;
        user.loyaltyDiscount = tier.discount;
        
        StateManager.set('user', user);
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
                tierIcon: nextTier.icon,
                discount: nextTier.discount
            };
        }
        
        return null;
    },
    
    // ===== نمایش مودال سطوح وفاداری =====
    showTiersModal: function() {
        const user = StateManager.get('user');
        const points = user?.loyaltyPoints?.total || 0;
        const currentTier = this.getTierByPoints(points);
        const nextTier = this.getPointsToNextTier(points);
        
        const modal = ModalFactory.createModal({
            title: '🏆 سطوح وفاداری',
            content: `
                <div class="tiers-container">
                    <div class="current-tier">
                        <h3>سطح فعلی: ${currentTier.name} ${currentTier.icon}</h3>
                        <p>تخفیف: ${currentTier.discount}%</p>
                        <p>امتیاز شما: ${points}</p>
                        ${nextTier ? `<p>${nextTier.needed} امتیاز تا سطح ${nextTier.tierName} ${nextTier.tierIcon}</p>` : '<p>به بالاترین سطح رسیده‌اید! 🎉</p>'}
                    </div>
                    <div class="tiers-list">
                        ${Object.entries(this.tiers).map(([key, tier]) => `
                            <div class="tier-item ${key === currentTier.key ? 'current' : ''}">
                                <div class="tier-icon">${tier.icon}</div>
                                <div class="tier-info">
                                    <div class="tier-name">${tier.name}</div>
                                    <div class="tier-points">حداقل ${tier.minPoints} امتیاز</div>
                                    <div class="tier-discount">${tier.discount}% تخفیف</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `,
            size: 'lg'
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    TierManager.init();
});

window.TierManager = TierManager;
