 /* ============================================
   REWARDS.JS - مدیریت جوایز وفاداری
   ============================================ */

const RewardsManager = {
    // جوایز قابل دریافت
    rewards: [
        {
            id: 'reward_1',
            name: 'کوپن تخفیف ۵۰,۰۰۰ تومانی',
            points: 500,
            type: 'coupon',
            value: 50000,
            icon: '🎫',
            description: 'دریافت کوپن تخفیف ۵۰ هزار تومانی'
        },
        {
            id: 'reward_2',
            name: 'یک نوبت رایگان',
            points: 1000,
            type: 'free_booking',
            value: 1,
            icon: '🎁',
            description: 'یک نوبت رایگان از هر خدمت'
        },
        {
            id: 'reward_3',
            name: 'کارت هدیه ۱۰۰,۰۰۰ تومانی',
            points: 800,
            type: 'gift_card',
            value: 100000,
            icon: '💳',
            description: 'کارت هدیه قابل استفاده در همه کسب‌وکارها'
        },
        {
            id: 'reward_4',
            name: 'عضو VIP ویژه',
            points: 2000,
            type: 'vip',
            value: 30,
            icon: '👑',
            description: 'یک ماه عضویت VIP با تخفیف ۳۰٪'
        }
    ],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('🎁 سیستم جوایز وفاداری راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('rewards:list', () => {
            return this.getAvailableRewards();
        });
        
        App.on('rewards:claim', (data) => {
            return this.claimReward(data.rewardId, data.userId);
        });
    },
    
    // ===== دریافت جوایز قابل دریافت =====
    getAvailableRewards: function(userId) {
        const userPoints = PointsSystem.getUserPoints(userId);
        return this.rewards.filter(reward => reward.points <= userPoints.total);
    },
    
    // ===== دریافت جایزه =====
    claimReward: async function(rewardId, userId) {
        const reward = this.rewards.find(r => r.id === rewardId);
        if (!reward) {
            return { success: false, message: 'جایزه یافت نشد' };
        }
        
        const userPoints = PointsSystem.getUserPoints(userId);
        if (userPoints.total < reward.points) {
            return { success: false, message: 'امتیاز کافی نیست' };
        }
        
        // کسر امتیاز
        const success = PointsSystem.deductPoints(userId, reward.points, `دریافت جایزه: ${reward.name}`);
        
        if (!success) {
            return { success: false, message: 'خطا در کسر امتیاز' };
        }
        
        // اعمال جایزه
        const rewardResult = await this.applyReward(reward, userId);
        
        App.emit('reward:claimed', { userId, reward, result: rewardResult });
        
        return { success: true, reward, result: rewardResult };
    },
    
    // ===== اعمال جایزه =====
    applyReward: async function(reward, userId) {
        switch(reward.type) {
            case 'coupon':
                return await this.createCoupon(userId, reward.value);
            case 'free_booking':
                return await this.addFreeBooking(userId);
            case 'gift_card':
                return await this.createGiftCard(userId, reward.value);
            case 'vip':
                return await this.activateVIP(userId, reward.value);
            default:
                return { success: false };
        }
    },
    
    // ===== ایجاد کوپن تخفیف =====
    createCoupon: async function(userId, amount) {
        const couponCode = `LOYALTY_${userId}_${Date.now()}`;
        const coupon = {
            code: couponCode,
            value: amount,
            type: 'fixed',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            userId: userId
        };
        
        // ذخیره کوپن
        const coupons = JSON.parse(localStorage.getItem('user_coupons') || '[]');
        coupons.push(coupon);
        localStorage.setItem('user_coupons', JSON.stringify(coupons));
        
        return { success: true, couponCode, amount };
    },
    
    // ===== افزودن نوبت رایگان =====
    addFreeBooking: async function(userId) {
        const freeBookings = JSON.parse(localStorage.getItem(`free_bookings_${userId}`) || '[]');
        freeBookings.push({
            id: Date.now(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            used: false
        });
        localStorage.setItem(`free_bookings_${userId}`, JSON.stringify(freeBookings));
        
        return { success: true, message: 'یک نوبت رایگان به حساب شما اضافه شد' };
    },
    
    // ===== ایجاد کارت هدیه =====
    createGiftCard: async function(userId, amount) {
        const giftCardId = `GIFT_${Date.now()}_${userId}`;
        const giftCard = {
            id: giftCardId,
            amount: amount,
            userId: userId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            used: false
        };
        
        const giftCards = JSON.parse(localStorage.getItem('gift_cards') || '[]');
        giftCards.push(giftCard);
        localStorage.setItem('gift_cards', JSON.stringify(giftCards));
        
        return { success: true, giftCardId, amount };
    },
    
    // ===== فعالسازی VIP =====
    activateVIP: async function(userId, days) {
        const vipStatus = {
            userId: userId,
            active: true,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
            discount: 30
        };
        
        localStorage.setItem(`vip_${userId}`, JSON.stringify(vipStatus));
        
        App.emit('vip:activated', { userId, days });
        
        return { success: true, message: `عضویت VIP به مدت ${days} روز فعال شد` };
    },
    
    // ===== نمایش مودال جوایز =====
    showRewardsModal: function() {
        const user = StateManager.get('user');
        if (!user) return;
        
        const availableRewards = this.getAvailableRewards(user.id);
        const userPoints = PointsSystem.getUserPoints(user.id);
        
        const modal = ModalFactory.createModal({
            title: '🎁 جوایز وفاداری',
            content: `
                <div class="rewards-container">
                    <div class="user-points">
                        <h3>امتیاز شما: ${userPoints.total}</h3>
                    </div>
                    <div class="rewards-list">
                        ${this.rewards.map(reward => `
                            <div class="reward-item ${availableRewards.find(r => r.id === reward.id) ? 'available' : 'locked'}">
                                <div class="reward-icon">${reward.icon}</div>
                                <div class="reward-info">
                                    <div class="reward-name">${reward.name}</div>
                                    <div class="reward-description">${reward.description}</div>
                                    <div class="reward-points">${reward.points} امتیاز</div>
                                </div>
                                ${availableRewards.find(r => r.id === reward.id) ? 
                                    `<button class="btn btn-primary claim-reward" data-id="${reward.id}">دریافت</button>` :
                                    `<button class="btn btn-outline" disabled>قفل</button>`
                                }
                            </div>
                        `).join('')}
                    </div>
                </div>
            `,
            size: 'lg',
            onOpen: () => {
                document.querySelectorAll('.claim-reward').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const rewardId = e.target.dataset.id;
                        const result = await this.claimReward(rewardId, user.id);
                        if (result.success) {
                            ModalFactory.closeModal();
                            InAppAlert.success(result.result.message || 'جایزه با موفقیت دریافت شد');
                        } else {
                            InAppAlert.error(result.message);
                        }
                    });
                });
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    RewardsManager.init();
});

window.RewardsManager = RewardsManager;
