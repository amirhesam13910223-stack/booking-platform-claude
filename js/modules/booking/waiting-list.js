 /* ============================================
   WAITING-LIST.JS - صف انتظار
   ============================================ */

const BookingWaitingList = {
    // لیست انتظار
    waitingList: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadWaitingList();
        this.attachEvents();
        console.log('⏳ ماژول WaitingList راه‌اندازی شد');
    },
    
    // ===== بارگذاری لیست انتظار =====
    loadWaitingList: function() {
        const saved = localStorage.getItem('waiting_list');
        if (saved) {
            this.waitingList = JSON.parse(saved);
        }
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('booking:join-waiting', (data) => {
            this.joinWaitingList(data);
        });
        
        App.on('booking:cancelled', (data) => {
            this.checkWaitingList(data.booking);
        });
    },
    
    // ===== پیوستن به صف انتظار =====
    joinWaitingList: function(data) {
        const { businessId, serviceId, preferredDates, customerInfo } = data;
        
        // بررسی وجود در لیست انتظار
        const exists = this.waitingList.some(item => 
            item.customerPhone === customerInfo.phone && 
            item.businessId === businessId
        );
        
        if (exists) {
            App.showToast('شما قبلاً در صف انتظار این کسب‌وکار هستید', 'warning');
            return;
        }
        
        const waitingItem = {
            id: 'WL' + Date.now() + Math.floor(Math.random() * 1000),
            businessId: businessId,
            serviceId: serviceId,
            customerInfo: customerInfo,
            preferredDates: preferredDates,
            status: 'waiting',
            joinedAt: new Date().toISOString(),
            priority: this.calculatePriority(customerInfo)
        };
        
        this.waitingList.push(waitingItem);
        this.saveWaitingList();
        
        App.showToast('✅ شما به صف انتظار اضافه شدید. در صورت آزاد شدن نوبت به شما اطلاع داده می‌شود', 'success');
        
        // ارسال رویداد
        App.emit('waiting:joined', waitingItem);
    },
    
    // ===== محاسبه اولویت =====
    calculatePriority: function(customerInfo) {
        let priority = 0;
        
        // امتیاز بر اساس تعداد نوبت‌های قبلی
        const userBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const userBookingCount = userBookings.filter(b => b.customer.phone === customerInfo.phone).length;
        priority += Math.min(userBookingCount, 10);
        
        // امتیاز بر اساس سطح وفاداری
        const user = AuthSession.getUser();
        if (user && user.loyaltyTier) {
            const tierPoints = { 'bronze': 1, 'silver': 2, 'gold': 3, 'platinum': 4, 'diamond': 5 };
            priority += tierPoints[user.loyaltyTier] || 0;
        }
        
        return priority;
    },
    
    // ===== بررسی صف انتظار =====
    checkWaitingList: function(cancelledBooking) {
        const waitingItems = this.waitingList.filter(item => 
            item.businessId === cancelledBooking.business.id && 
            item.status === 'waiting'
        );
        
        if (waitingItems.length === 0) return;
        
        // مرتب‌سازی بر اساس اولویت و زمان
        waitingItems.sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority;
            return new Date(a.joinedAt) - new Date(b.joinedAt);
        });
        
        // اطلاع به نفر اول صف
        const nextInLine = waitingItems[0];
        this.notifyUser(nextInLine, cancelledBooking);
    },
    
    // ===== اطلاع به کاربر =====
    notifyUser: function(waitingItem, availableBooking) {
        // شبیه‌سازی ارسال پیامک
        console.log(`📱 ارسال پیامک به ${waitingItem.customerInfo.phone}: نوبت خالی شد!`);
        
        App.showToast(`نوبت خالی شد! به ${waitingItem.customerInfo.name} پیامک اطلاع‌رسانی شد`, 'info');
        
        // به‌روزرسانی وضعیت
        waitingItem.status = 'notified';
        waitingItem.notifiedAt = new Date().toISOString();
        this.saveWaitingList();
        
        // در حالت واقعی، لینک رزرو سریع ارسال می‌شود
        App.emit('waiting:notified', { waitingItem, availableBooking });
        
        // حذف از لیست انتظار بعد از 30 دقیقه (در صورت عدم رزرو)
        setTimeout(() => {
            if (waitingItem.status === 'notified') {
                waitingItem.status = 'expired';
                this.saveWaitingList();
            }
        }, 30 * 60 * 1000);
    },
    
    // ===== دریافت وضعیت صف انتظار =====
    getWaitingStatus: function(phone) {
        const userItems = this.waitingList.filter(item => 
            item.customerInfo.phone === phone
        );
        
        return userItems.map(item => ({
            businessId: item.businessId,
            status: item.status,
            position: this.getPositionInLine(item.id),
            joinedAt: item.joinedAt
        }));
    },
    
    // ===== دریافت موقعیت در صف =====
    getPositionInLine: function(waitingId) {
        const activeWaiting = this.waitingList.filter(item => item.status === 'waiting');
        const index = activeWaiting.findIndex(item => item.id === waitingId);
        return index !== -1 ? index + 1 : null;
    },
    
    // ===== خروج از صف انتظار =====
    leaveWaitingList: function(waitingId) {
        const index = this.waitingList.findIndex(item => item.id === waitingId);
        if (index !== -1) {
            this.waitingList.splice(index, 1);
            this.saveWaitingList();
            App.showToast('از صف انتظار خارج شدید', 'info');
        }
    },
    
    // ===== ذخیره لیست انتظار =====
    saveWaitingList: function() {
        localStorage.setItem('waiting_list', JSON.stringify(this.waitingList));
    },
    
    // ===== توابع کمکی =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    BookingWaitingList.init();
});

window.BookingWaitingList = BookingWaitingList;
