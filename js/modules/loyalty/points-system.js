 /* ============================================
   POINTS-SYSTEM.JS - سیستم امتیازدهی وفاداری
   ============================================ */

const PointsSystem = {
    // نرخ‌های امتیازدهی
    rates: {
        registration: 100,
        booking: 50,
        review: 20,
        referral: 200,
        birthday: 50,
        firstBooking: 100,
        perThousandSpent: 1 // 1 امتیاز به ازای هر 10,000 تومان
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('⭐ سیستم امتیازدهی وفاداری راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on(SystemEvents.AUTH_LOGIN, (data) => {
            this.loadUserPoints(data.user);
        });
        
        App.on(SystemEvents.BOOKING_CREATED, (data) => {
            this.addPointsForBooking(data);
        });
        
        App.on('review:submitted', (data) => {
            this.addPoints(data.userId, this.rates.review, 'ثبت نظر');
        });
        
        App.on('referral:used', (data) => {
            this.addPoints(data.referrerId, this.rates.referral, 'معرفی دوست');
        });
    },
    
    // ===== بارگذاری امتیازات کاربر =====
    loadUserPoints: function(user) {
        if (!user || !user.id) return;
        
        const points = this.getUserPoints(user.id);
        user.loyaltyPoints = points;
        
        // بروزرسانی state
        StateManager.set('user', user);
        
        App.emit('points:loaded', { userId: user.id, points });
    },
    
    // ===== دریافت امتیازات کاربر =====
    getUserPoints: function(userId) {
        const pointsData = localStorage.getItem(`points_${userId}`);
        if (pointsData) {
            try {
                return JSON.parse(pointsData);
            } catch(e) {}
        }
        return { total: 0, history: [] };
    },
    
    // ===== ذخیره امتیازات کاربر =====
    saveUserPoints: function(userId, pointsData) {
        localStorage.setItem(`points_${userId}`, JSON.stringify(pointsData));
    },
    
    // ===== افزودن امتیاز =====
    addPoints: function(userId, points, reason, metadata = {}) {
        const pointsData = this.getUserPoints(userId);
        
        pointsData.total += points;
        pointsData.history.unshift({
            points: points,
            reason: reason,
            date: new Date().toISOString(),
            metadata: metadata
        });
        
        // محدودیت تاریخچه (نگهداری 100 آیتم آخر)
        if (pointsData.history.length > 100) {
            pointsData.history.pop();
        }
        
        this.saveUserPoints(userId, pointsData);
        
        App.emit('points:added', { userId, points, reason, total: pointsData.total });
        
        return pointsData.total;
    },
    
    // ===== کسر امتیاز =====
    deductPoints: function(userId, points, reason) {
        const pointsData = this.getUserPoints(userId);
        
        if (pointsData.total < points) {
            return false;
        }
        
        pointsData.total -= points;
        pointsData.history.unshift({
            points: -points,
            reason: reason,
            date: new Date().toISOString()
        });
        
        this.saveUserPoints(userId, pointsData);
        
        App.emit('points:deducted', { userId, points, reason, total: pointsData.total });
        
        return true;
    },
    
    // ===== افزودن امتیاز برای رزرو =====
    addPointsForBooking: function(booking) {
        const userId = booking.customer?.id;
        if (!userId) return;
        
        let points = this.rates.booking;
        
        // امتیاز بر اساس مبلغ
        const spentPoints = Math.floor(booking.finalPrice / 10000) * this.rates.perThousandSpent;
        points += spentPoints;
        
        // امتیاز اولین رزرو
        const userPoints = this.getUserPoints(userId);
        const isFirstBooking = userPoints.history.filter(h => h.reason === 'رزرو نوبت').length === 0;
        if (isFirstBooking) {
            points += this.rates.firstBooking;
        }
        
        this.addPoints(userId, points, 'رزرو نوبت', { bookingId: booking.id });
    },
    
    // ===== تبدیل امتیاز به تخفیف =====
    convertPointsToDiscount: function(userId, points) {
        const discountAmount = points * 100; // هر امتیاز = 100 تومان
        const success = this.deductPoints(userId, points, 'تبدیل امتیاز به تخفیف');
        
        if (success) {
            App.emit('points:converted', { userId, points, discountAmount });
        }
        
        return success ? discountAmount : 0;
    },
    
    // ===== دریافت تاریخچه امتیازات =====
    getPointsHistory: function(userId, limit = 20) {
        const pointsData = this.getUserPoints(userId);
        return pointsData.history.slice(0, limit);
    },
    
    // ===== بررسی امکان استفاده از امتیاز =====
    canUsePoints: function(userId, points) {
        const pointsData = this.getUserPoints(userId);
        return pointsData.total >= points;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PointsSystem.init();
});

window.PointsSystem = PointsSystem;
