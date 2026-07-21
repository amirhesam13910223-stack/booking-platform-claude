 /* ============================================
   REFERRAL.JS - تخفیف معرفی دوستان
   ============================================ */

const ReferralDiscount = {
    // کد معرفی کاربر فعلی
    currentReferralCode: null,
    
    // آمار معرفی
    referralStats: {
        totalReferrals: 0,
        successfulReferrals: 0,
        totalDiscountEarned: 0
    },
    
    // تخفیف‌های معرفی
    referralRewards: {
        referrer: {
            firstBooking: 50000,
            eachBooking: 20000,
            percent: 10
        },
        referee: {
            firstBooking: 30000,
            percent: 15
        }
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.generateReferralCode();
        this.loadReferralStats();
        this.attachEvents();
        console.log('👥 سیستم معرفی دوستان راه‌اندازی شد');
    },
    
    // ===== تولید کد معرفی =====
    generateReferralCode: function() {
        const user = AuthSession.getUser();
        if (!user) return;
        
        if (user.referralCode) {
            this.currentReferralCode = user.referralCode;
        } else {
            this.currentReferralCode = user.name.replace(/\s/g, '').substring(0, 4).toUpperCase() + 
                                       Math.floor(Math.random() * 10000);
            user.referralCode = this.currentReferralCode;
            localStorage.setItem('user', JSON.stringify(user));
            StateManager.set('user', user);
        }
    },
    
    // ===== بارگذاری آمار معرفی =====
    loadReferralStats: function() {
        const user = AuthSession.getUser();
        if (!user) return;
        
        const saved = localStorage.getItem(`referral_stats_${user.id}`);
        if (saved) {
            try {
                this.referralStats = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره آمار معرفی =====
    saveReferralStats: function() {
        const user = AuthSession.getUser();
        if (!user) return;
        localStorage.setItem(`referral_stats_${user.id}`, JSON.stringify(this.referralStats));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('referral:use', (data) => {
            this.useReferralCode(data);
        });
        
        App.on(SystemEvents.BOOKING_CREATED, (data) => {
            this.checkReferralBooking(data);
        });
    },
    
    // ===== استفاده از کد معرفی =====
    useReferralCode: function(data) {
        const { code, newUserId, newUserPhone } = data;
        
        // پیدا کردن کاربر معرف
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const referrer = users.find(u => u.referralCode === code);
        
        if (!referrer) {
            App.showToast('کد معرفی نامعتبر است', 'error');
            return false;
        }
        
        if (referrer.phone === newUserPhone) {
            App.showToast('نمی‌توانید از کد معرفی خود استفاده کنید', 'error');
            return false;
        }
        
        // ذخیره اطلاعات معرفی برای کاربر جدید
        const referralInfo = {
            referrerId: referrer.id,
            referrerPhone: referrer.phone,
            referrerName: referrer.name,
            referralCode: code,
            usedAt: new Date().toISOString(),
            status: 'pending_first_booking'
        };
        
        localStorage.setItem(`referral_${newUserId}`, JSON.stringify(referralInfo));
        
        App.showToast(`کد معرفی ${code} با موفقیت ثبت شد! پس از اولین نوبت، هر دو نفر تخفیف دریافت می‌کنید`, 'success');
        
        App.emit('referral:registered', referralInfo);
        return true;
    },
    
    // ===== بررسی نوبت معرفی شده =====
    checkReferralBooking: function(booking) {
        const userId = booking.customer?.phone || booking.customer?.id;
        if (!userId) return;
        
        const referralInfo = localStorage.getItem(`referral_${userId}`);
        if (!referralInfo) return;
        
        const referral = JSON.parse(referralInfo);
        
        if (referral.status === 'pending_first_booking') {
            // اولین نوبت - جایزه به هر دو
            this.rewardReferral(referral, booking);
            referral.status = 'completed';
            localStorage.setItem(`referral_${userId}`, JSON.stringify(referral));
        } else if (referral.status === 'completed') {
            // نوبت‌های بعدی - جایزه به معرف
            this.rewardReferrerForBooking(referral, booking);
        }
    },
    
    // ===== پاداش اولین نوبت معرفی =====
    rewardReferral: function(referral, booking) {
        // پاداش به معرف
        const referrerDiscount = this.referralRewards.referrer.firstBooking;
        this.addReferralReward(referral.referrerId, referrerDiscount, 'معرفی دوست (نوبت اول)');
        
        // پاداش به کاربر جدید
        const refereeDiscount = this.referralRewards.referee.firstBooking;
        this.addReferralReward(booking.customer.id, refereeDiscount, 'تخفیف معرفی دوست');
        
        // افزایش آمار
        this.referralStats.totalReferrals++;
        this.referralStats.successfulReferrals++;
        this.referralStats.totalDiscountEarned += referrerDiscount;
        this.saveReferralStats();
        
        App.showToast(`🎉 شما و دوستتان هر کدوم ${this.formatPrice(referrerDiscount)} تخفیف گرفتید!`, 'success');
    },
    
    // ===== پاداش نوبت‌های بعدی =====
    rewardReferrerForBooking: function(referral, booking) {
        const discountPercent = this.referralRewards.referrer.percent;
        const discountAmount = (booking.finalPrice * discountPercent) / 100;
        
        this.addReferralReward(referral.referrerId, discountAmount, `تخفیف معرفی (نوبت شماره ${this.referralStats.totalReferrals + 1})`);
        
        this.referralStats.totalDiscountEarned += discountAmount;
        this.saveReferralStats();
        
        App.showToast(`🎁 شما ${this.formatPrice(discountAmount)} تخفیف به دلیل معرفی دوست خود دریافت کردید!`, 'success');
    },
    
    // ===== افزودن تخفیف معرفی به حساب کاربر =====
    addReferralReward: function(userId, amount, description) {
        const rewards = JSON.parse(localStorage.getItem('referral_rewards') || '[]');
        rewards.push({
            userId: userId,
            amount: amount,
            description: description,
            used: false,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('referral_rewards', JSON.stringify(rewards));
        
        App.emit('referral:reward-added', { userId, amount, description });
    },
    
    // ===== دریافت تخفیف‌های معرفی کاربر =====
    getUserReferralRewards: function(userId) {
        const rewards = JSON.parse(localStorage.getItem('referral_rewards') || '[]');
        return rewards.filter(r => r.userId === userId && !r.used);
    },
    
    // ===== دریافت تخفیف معرفی برای پرداخت =====
    getReferralDiscount: function(userId, amount) {
        const rewards = this.getUserReferralRewards(userId);
        if (rewards.length === 0) return { amount: 0, percent: 0, name: null };
        
        let totalDiscount = rewards.reduce((sum, r) => sum + r.amount, 0);
        const discountPercent = (totalDiscount / amount) * 100;
        
        if (totalDiscount > amount) totalDiscount = amount;
        
        return {
            amount: totalDiscount,
            percent: Math.min(discountPercent, 30),
            name: 'تخفیف معرفی دوستان'
        };
    },
    
    // ===== استفاده از تخفیف معرفی =====
    useReferralReward: function(userId, amount) {
        const rewards = JSON.parse(localStorage.getItem('referral_rewards') || '[]');
        let remainingAmount = amount;
        let usedRewards = [];
        
        for (let reward of rewards) {
            if (reward.userId === userId && !reward.used && remainingAmount > 0) {
                if (reward.amount <= remainingAmount) {
                    reward.used = true;
                    remainingAmount -= reward.amount;
                    usedRewards.push(reward);
                } else {
                    // split reward
                    const newReward = { ...reward, amount: reward.amount - remainingAmount };
                    reward.amount = remainingAmount;
                    reward.used = true;
                    rewards.push(newReward);
                    remainingAmount = 0;
                    usedRewards.push(reward);
                }
            }
        }
        
        localStorage.setItem('referral_rewards', JSON.stringify(rewards));
        return usedRewards;
    },
    
    // ===== نمایش مودال معرفی دوستان =====
    showReferralModal: function() {
        const user = AuthSession.getUser();
        if (!user) {
            App.showToast('لطفاً ابتدا وارد شوید', 'warning');
            return;
        }
        
        const referralLink = `${window.location.origin}/register?ref=${this.currentReferralCode}`;
        
        const modal = document.createElement('div');
        modal.id = 'referralModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👥 معرفی دوستان</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="referral-info">
                        <p>دوستان خود را دعوت کنید و از مزایای زیر بهره‌مند شوید:</p>
                        <ul>
                            <li>🎁 شما: ${this.formatPrice(this.referralRewards.referrer.firstBooking)} تومان تخفیف + ${this.referralRewards.referrer.percent}٪ از هر نوبت</li>
                            <li>🎁 دوست شما: ${this.formatPrice(this.referralRewards.referee.firstBooking)} تومان تخفیف اولین نوبت</li>
                        </ul>
                    </div>
                    
                    <div class="referral-code-box">
                        <div class="code-label">کد معرفی شما:</div>
                        <div class="code-value" id="referralCode">${this.currentReferralCode}</div>
                        <button class="btn btn-outline btn-small" id="copyReferralCode">📋 کپی کد</button>
                    </div>
                    
                    <div class="referral-link-box">
                        <div class="code-label">لینک معرفی:</div>
                        <div class="link-value" id="referralLink">${referralLink}</div>
                        <button class="btn btn-outline btn-small" id="copyReferralLink">📋 کپی لینک</button>
                    </div>
                    
                    <div class="referral-stats">
                        <div class="stat-item">
                            <span class="stat-value">${this.referralStats.successfulReferrals}</span>
                            <span class="stat-label">معرفی موفق</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${this.formatPrice(this.referralStats.totalDiscountEarned)}</span>
                            <span class="stat-label">تخفیف کسب شده</span>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary btn-block" id="shareReferralBtn">📱 اشتراک‌گذاری</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('copyReferralCode')?.addEventListener('click', () => {
            navigator.clipboard.writeText(this.currentReferralCode);
            App.showToast('کد معرفی کپی شد', 'success');
        });
        
        document.getElementById('copyReferralLink')?.addEventListener('click', () => {
            navigator.clipboard.writeText(referralLink);
            App.showToast('لینک معرفی کپی شد', 'success');
        });
        
        document.getElementById('shareReferralBtn')?.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: 'دعوت به پلتفرم نوبت‌دهی',
                    text: `با استفاده از کد ${this.currentReferralCode} ثبت‌نام کنید و از تخفیف ویژه بهره‌مند شوید!`,
                    url: referralLink
                });
            } else {
                App.showToast('لینک کپی شد، می‌توانید آن را به اشتراک بگذارید', 'info');
            }
        });
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

// استایل‌های معرفی
const referralStyles = `
<style>
.referral-info {
    background: var(--color-primary-soft);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
}

.referral-info ul {
    margin-top: 10px;
    padding-right: 20px;
}

.referral-info li {
    margin-bottom: 5px;
}

.referral-code-box, .referral-link-box {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 15px;
    text-align: center;
}

.code-label {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-bottom: 5px;
}

.code-value, .link-value {
    font-size: 20px;
    font-weight: bold;
    color: var(--color-primary);
    margin-bottom: 10px;
    word-break: break-all;
}

.link-value {
    font-size: 14px;
}

.btn-small {
    padding: 5px 10px;
    font-size: 12px;
}

.referral-stats {
    display: flex;
    justify-content: space-around;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    margin: 20px 0;
}

.referral-stats .stat-item {
    text-align: center;
}

.referral-stats .stat-value {
    display: block;
    font-size: 24px;
    font-weight: bold;
    color: var(--color-primary);
}

.referral-stats .stat-label {
    font-size: 12px;
    color: var(--text-tertiary);
}
</style>
`;

if (!document.querySelector('#referral-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'referral-styles';
    styleSheet.textContent = referralStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    ReferralDiscount.init();
});

window.ReferralDiscount = ReferralDiscount;
