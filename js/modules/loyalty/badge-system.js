 /* ============================================
   BADGE-SYSTEM.JS - سیستم نشان‌های افتخار
   ============================================ */

const BadgeSystem = {
    // نشان‌های قابل کسب
    badges: [
        {
            id: 'first_booking',
            name: 'شروع کننده',
            description: 'اولین نوبت خود را رزرو کردید',
            icon: '🎯',
            condition: 'bookings_count >= 1',
            color: '#10B981'
        },
        {
            id: 'loyal_customer',
            name: 'مشتری وفادار',
            description: '۱۰ نوبت موفق',
            icon: '⭐',
            condition: 'bookings_count >= 10',
            color: '#F59E0B'
        },
        {
            id: 'super_customer',
            name: 'مشتری فوق‌العاده',
            description: '۵۰ نوبت موفق',
            icon: '👑',
            condition: 'bookings_count >= 50',
            color: '#8B5CF6'
        },
        {
            id: 'reviewer',
            name: 'نظر دهنده',
            description: '۵ نظر ثبت کرده‌اید',
            icon: '📝',
            condition: 'reviews_count >= 5',
            color: '#3B82F6'
        },
        {
            id: 'ambassador',
            name: 'سفیر برند',
            description: '۱۰ دوست معرفی کرده‌اید',
            icon: '🤝',
            condition: 'referrals_count >= 10',
            color: '#EC4899'
        },
        {
            id: 'early_bird',
            name: 'سحرخیز',
            description: '۱۰ نوبت قبل از ۹ صبح',
            icon: '🌅',
            condition: 'early_bookings >= 10',
            color: '#F97316'
        },
        {
            id: 'night_owl',
            name: 'شب‌نشین',
            description: '۱۰ نوبت بعد از ۱۰ شب',
            icon: '🦉',
            condition: 'night_bookings >= 10',
            color: '#6366F1'
        }
    ],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('🎖️ سیستم نشان‌های افتخار راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on(SystemEvents.BOOKING_CREATED, (data) => {
            this.checkBadges(data.customer.id);
        });
        
        App.on('review:submitted', (data) => {
            this.checkBadges(data.userId);
        });
        
        App.on('referral:used', (data) => {
            this.checkBadges(data.referrerId);
        });
    },
    
    // ===== دریافت نشان‌های کاربر =====
    getUserBadges: function(userId) {
        const badges = localStorage.getItem(`badges_${userId}`);
        if (badges) {
            try {
                return JSON.parse(badges);
            } catch(e) {}
        }
        return [];
    },
    
    // ===== ذخیره نشان‌های کاربر =====
    saveUserBadges: function(userId, badges) {
        localStorage.setItem(`badges_${userId}`, JSON.stringify(badges));
    },
    
    // ===== افزودن نشان =====
    addBadge: function(userId, badgeId) {
        const userBadges = this.getUserBadges(userId);
        if (userBadges.includes(badgeId)) return false;
        
        userBadges.push(badgeId);
        this.saveUserBadges(userId, userBadges);
        
        const badge = this.badges.find(b => b.id === badgeId);
        App.emit('badge:earned', { userId, badge });
        
        InAppAlert.success(`🎉 نشان "${badge.name}" را دریافت کردید!`, 'نشان جدید');
        
        return true;
    },
    
    // ===== بررسی شرایط نشان‌ها =====
    checkBadges: function(userId) {
        const userBadges = this.getUserBadges(userId);
        const userStats = this.getUserStats(userId);
        
        for (const badge of this.badges) {
            if (userBadges.includes(badge.id)) continue;
            
            if (this.checkCondition(badge.condition, userStats)) {
                this.addBadge(userId, badge.id);
            }
        }
    },
    
    // ===== بررسی شرط =====
    checkCondition: function(condition, stats) {
        const [key, operator, value] = condition.split(' ');
        const statValue = stats[key] || 0;
        
        switch(operator) {
            case '>=': return statValue >= parseInt(value);
            case '>': return statValue > parseInt(value);
            case '<=': return statValue <= parseInt(value);
            case '<': return statValue < parseInt(value);
            case '==': return statValue == parseInt(value);
            default: return false;
        }
    },
    
    // ===== دریافت آمار کاربر =====
    getUserStats: function(userId) {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const userBookings = bookings.filter(b => b.customer?.id === userId);
        
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        const userReviews = reviews.filter(r => r.userId === userId);
        
        const referrals = JSON.parse(localStorage.getItem('referrals') || '[]');
        const userReferrals = referrals.filter(r => r.referrerId === userId);
        
        let earlyBookings = 0;
        let nightBookings = 0;
        
        userBookings.forEach(booking => {
            const hour = parseInt(booking.time.split(':')[0]);
            if (hour < 9) earlyBookings++;
            if (hour >= 22) nightBookings++;
        });
        
        return {
            bookings_count: userBookings.length,
            reviews_count: userReviews.length,
            referrals_count: userReferrals.length,
            early_bookings: earlyBookings,
            night_bookings: nightBookings
        };
    },
    
    // ===== نمایش مودال نشان‌ها =====
    showBadgesModal: function() {
        const user = StateManager.get('user');
        if (!user) return;
        
        const userBadges = this.getUserBadges(user.id);
        
        const modal = ModalFactory.createModal({
            title: '🎖️ نشان‌های افتخار',
            content: `
                <div class="badges-container">
                    <div class="badges-grid">
                        ${this.badges.map(badge => {
                            const earned = userBadges.includes(badge.id);
                            return `
                                <div class="badge-card ${earned ? 'earned' : 'locked'}">
                                    <div class="badge-icon" style="background: ${badge.color}20; color: ${badge.color}">
                                        ${badge.icon}
                                    </div>
                                    <div class="badge-info">
                                        <div class="badge-name">${badge.name}</div>
                                        <div class="badge-description">${badge.description}</div>
                                    </div>
                                    ${earned ? '<span class="badge-earned">✅ دریافت شده</span>' : '<span class="badge-locked">🔒 قفل</span>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `,
            size: 'lg'
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    BadgeSystem.init();
});

window.BadgeSystem = BadgeSystem;
