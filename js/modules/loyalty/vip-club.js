 /* ============================================
   VIP-CLUB.JS - باشگاه ویژه مشتریان VIP
   ============================================ */

const VIPClub = {
    // سطوح VIP
    vipLevels: [
        {
            level: 1,
            name: 'VIP برنزی',
            minSpent: 1000000,
            discount: 10,
            benefits: ['۱۰٪ تخفیف اضافی', 'اولویت در رزرو', 'پشتیبانی ویژه'],
            icon: '🥉'
        },
        {
            level: 2,
            name: 'VIP نقره‌ای',
            minSpent: 5000000,
            discount: 15,
            benefits: ['۱۵٪ تخفیف اضافی', 'لغو رایگان', 'هدیه ماهانه'],
            icon: '🥈'
        },
        {
            level: 3,
            name: 'VIP طلایی',
            minSpent: 10000000,
            discount: 20,
            benefits: ['۲۰٪ تخفیف اضافی', 'رزرو اختصاصی', 'مشاور رایگان'],
            icon: '🥇'
        },
        {
            level: 4,
            name: 'VIP پلاتینیوم',
            minSpent: 25000000,
            discount: 25,
            benefits: ['۲۵٪ تخفیف اضافی', 'رویدادهای ویژه', 'هدیه تولد'],
            icon: '💎'
        },
        {
            level: 5,
            name: 'VIP الماس',
            minSpent: 50000000,
            discount: 30,
            benefits: ['۳۰٪ تخفیف اضافی', 'دعوت به رویدادها', 'سفر VIP'],
            icon: '👑'
        }
    ],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('👑 باشگاه VIP راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on(SystemEvents.BOOKING_CREATED, (data) => {
            this.updateVIPStatus(data.customer.id);
        });
    },
    
    // ===== دریافت وضعیت VIP کاربر =====
    getVIPStatus: function(userId) {
        const status = localStorage.getItem(`vip_${userId}`);
        if (status) {
            try {
                return JSON.parse(status);
            } catch(e) {}
        }
        return { level: 0, active: false };
    },
    
    // ===== ذخیره وضعیت VIP =====
    saveVIPStatus: function(userId, status) {
        localStorage.setItem(`vip_${userId}`, JSON.stringify(status));
    },
    
    // ===== دریافت کل هزینه کاربر =====
    getUserTotalSpent: function(userId) {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const userBookings = bookings.filter(b => b.customer?.id === userId && b.status === 'completed');
        return userBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    },
    
    // ===== محاسبه سطح VIP =====
    calculateVIPLevel: function(totalSpent) {
        let level = 0;
        for (const vip of this.vipLevels) {
            if (totalSpent >= vip.minSpent) {
                level = vip.level;
            }
        }
        return level;
    },
    
    // ===== بروزرسانی وضعیت VIP =====
    updateVIPStatus: function(userId) {
        const totalSpent = this.getUserTotalSpent(userId);
        const newLevel = this.calculateVIPLevel(totalSpent);
        const currentStatus = this.getVIPStatus(userId);
        
        if (newLevel > currentStatus.level) {
            this.upgradeVIP(userId, newLevel, totalSpent);
        } else if (currentStatus.level === 0 && newLevel > 0) {
            this.activateVIP(userId, newLevel, totalSpent);
        }
    },
    
    // ===== فعالسازی VIP =====
    activateVIP: function(userId, level, totalSpent) {
        const vipInfo = this.vipLevels.find(v => v.level === level);
        
        const status = {
            level: level,
            active: true,
            activatedAt: new Date().toISOString(),
            totalSpent: totalSpent,
            discount: vipInfo.discount
        };
        
        this.saveVIPStatus(userId, status);
        
        App.emit('vip:activated', { userId, level, discount: vipInfo.discount });
        
        InAppAlert.success(
            `🎉 تبریک! شما به باشگاه VIP خوش آمدید. سطح ${vipInfo.name} با ${vipInfo.discount}% تخفیف اضافی.`,
            'عضویت در VIP کلاب'
        );
    },
    
    // ===== ارتقای سطح VIP =====
    upgradeVIP: function(userId, newLevel, totalSpent) {
        const oldStatus = this.getVIPStatus(userId);
        const newVipInfo = this.vipLevels.find(v => v.level === newLevel);
        
        const status = {
            level: newLevel,
            active: true,
            activatedAt: oldStatus.activatedAt,
            upgradedAt: new Date().toISOString(),
            totalSpent: totalSpent,
            discount: newVipInfo.discount
        };
        
        this.saveVIPStatus(userId, status);
        
        App.emit('vip:upgraded', { userId, oldLevel: oldStatus.level, newLevel, discount: newVipInfo.discount });
        
        InAppAlert.success(
            `🎉 تبریک! سطح VIP شما به ${newVipInfo.name} ارتقا یافت. تخفیف شما به ${newVipInfo.discount}% افزایش یافت.`,
            'ارتقای سطح VIP'
        );
    },
    
    // ===== دریافت تخفیف VIP =====
    getVIPDiscount: function(userId) {
        const status = this.getVIPStatus(userId);
        if (!status.active) return 0;
        const vipInfo = this.vipLevels.find(v => v.level === status.level);
        return vipInfo ? vipInfo.discount : 0;
    },
    
    // ===== نمایش مودال باشگاه VIP =====
    showVIPModal: function() {
        const user = StateManager.get('user');
        if (!user) return;
        
        const status = this.getVIPStatus(user.id);
        const totalSpent = this.getUserTotalSpent(user.id);
        const nextLevel = this.vipLevels.find(v => v.level === (status.level + 1));
        
        const modal = ModalFactory.createModal({
            title: '👑 باشگاه VIP',
            content: `
                <div class="vip-container">
                    ${status.active ? `
                        <div class="current-vip">
                            <h3>سطح فعلی: ${this.vipLevels.find(v => v.level === status.level)?.name || 'VIP'}</h3>
                            <p>تخفیف اضافی: ${status.discount}%</p>
                            <p>مجموع هزینه: ${totalSpent.toLocaleString('fa-IR')} تومان</p>
                        </div>
                        ${nextLevel ? `
                            <div class="next-vip">
                                <h4>${nextLevel.minSpent - totalSpent.toLocaleString('fa-IR')} تومان تا سطح ${nextLevel.name}</h4>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${Math.min(100, (totalSpent / nextLevel.minSpent) * 100)}%"></div>
                                </div>
                            </div>
                        ` : '<p>🎉 به بالاترین سطح VIP رسیده‌اید!</p>'}
                    ` : `
                        <div class="vip-cta">
                            <p>با خرید بیش از ${this.vipLevels[0].minSpent.toLocaleString('fa-IR')} تومان، عضو باشگاه VIP شوید!</p>
                            <p>مزایای VIP:</p>
                            <ul>
                                <li>تا ۳۰٪ تخفیف اضافی</li>
                                <li>اولویت در رزرو</li>
                                <li>پشتیبانی ویژه</li>
                                <li>هدایای اختصاصی</li>
                            </ul>
                        </div>
                    `}
                    
                    <div class="vip-levels">
                        <h4>سطوح VIP</h4>
                        ${this.vipLevels.map(level => `
                            <div class="vip-level ${status.level >= level.level ? 'achieved' : ''}">
                                <div class="level-icon">${level.icon}</div>
                                <div class="level-info">
                                    <div class="level-name">${level.name}</div>
                                    <div class="level-benefits">${level.benefits.join(' • ')}</div>
                                </div>
                                <div class="level-min">حداقل ${level.minSpent.toLocaleString('fa-IR')} تومان</div>
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
    VIPClub.init();
});

window.VIPClub = VIPClub;
