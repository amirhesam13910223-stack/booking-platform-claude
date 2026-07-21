 /* ============================================
   PLATFORM-STATS.JS - آمار کلی پلتفرم
   ============================================ */

const PlatformStats = {
    // آمار کلی
    stats: {
        users: { total: 0, active: 0, blocked: 0, newThisMonth: 0 },
        businesses: { total: 0, pending: 0, verified: 0, rejected: 0 },
        bookings: { total: 0, completed: 0, cancelled: 0, pending: 0 },
        revenue: { total: 0, monthly: 0, daily: 0, commission: 0 },
        discounts: { total: 0, averagePercent: 0, totalAmount: 0 }
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadAllStats();
        this.attachEvents();
        console.log('📊 ماژول آمار پلتفرم راه‌اندازی شد');
    },
    
    // ===== بارگذاری تمام آمار =====
    loadAllStats: function() {
        this.loadUserStats();
        this.loadBusinessStats();
        this.loadBookingStats();
        this.loadRevenueStats();
        this.loadDiscountStats();
    },
    
    // ===== آمار کاربران =====
    loadUserStats: function() {
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        this.stats.users.total = users.length;
        this.stats.users.active = users.filter(u => u.status !== 'blocked').length;
        this.stats.users.blocked = users.filter(u => u.status === 'blocked').length;
        this.stats.users.newThisMonth = users.filter(u => new Date(u.createdAt) >= firstDayOfMonth).length;
    },
    
    // ===== آمار کسب‌وکارها =====
    loadBusinessStats: function() {
        const businesses = JSON.parse(localStorage.getItem('businesses_list') || '[]');
        
        this.stats.businesses.total = businesses.length;
        this.stats.businesses.pending = businesses.filter(b => b.status === 'pending').length;
        this.stats.businesses.verified = businesses.filter(b => b.status === 'verified').length;
        this.stats.businesses.rejected = businesses.filter(b => b.status === 'rejected').length;
    },
    
    // ===== آمار نوبت‌ها =====
    loadBookingStats: function() {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        
        this.stats.bookings.total = bookings.length;
        this.stats.bookings.completed = bookings.filter(b => b.status === 'completed').length;
        this.stats.bookings.cancelled = bookings.filter(b => b.status === 'cancelled').length;
        this.stats.bookings.pending = bookings.filter(b => b.status === 'pending').length;
    },
    
    // ===== آمار درآمد =====
    loadRevenueStats: function() {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const completedBookings = bookings.filter(b => b.status === 'completed');
        
        const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
        this.stats.revenue.total = totalRevenue;
        this.stats.revenue.commission = totalRevenue * 0.03;
        
        // درآمد ماه جاری
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyBookings = completedBookings.filter(b => new Date(b.date) >= firstDayOfMonth);
        this.stats.revenue.monthly = monthlyBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
        
        // درآمد امروز
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = completedBookings.filter(b => b.date === today);
        this.stats.revenue.daily = todayBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    },
    
    // ===== آمار تخفیف‌ها =====
    loadDiscountStats: function() {
        const discounts = JSON.parse(localStorage.getItem('discount_history') || '[]');
        
        this.stats.discounts.total = discounts.length;
        this.stats.discounts.totalAmount = discounts.reduce((sum, d) => sum + (d.discountAmount || 0), 0);
        
        const avgPercent = discounts.reduce((sum, d) => sum + (d.discountPercent || 0), 0) / (discounts.length || 1);
        this.stats.discounts.averagePercent = avgPercent;
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('stats:refresh', () => {
            this.loadAllStats();
        });
    },
    
    // ===== نمایش مودال آمار =====
    showStatsModal: function() {
        const modal = document.createElement('div');
        modal.id = 'platformStatsModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>📊 آمار کامل پلتفرم</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stats-section">
                        <h4>👥 آمار کاربران</h4>
                        <div class="stats-grid">
                            <div class="stat-item">کل کاربران: <strong>${this.stats.users.total.toLocaleString('fa-IR')}</strong></div>
                            <div class="stat-item">کاربران فعال: <strong>${this.stats.users.active.toLocaleString('fa-IR')}</strong></div>
                            <div class="stat-item">کاربران مسدود: <strong>${this.stats.users.blocked.toLocaleString('fa-IR')}</strong></div>
                            <div class="stat-item">جدید این ماه: <strong>${this.stats.users.newThisMonth.toLocaleString('fa-IR')}</strong></div>
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <h4>🏢 آمار کسب‌وکارها</h4>
                        <div class="stats-grid">
                            <div class="stat-item">کل کسب‌وکارها: <strong>${this.stats.businesses.total}</strong></div>
                            <div class="stat-item">در انتظار تأیید: <strong class="text-warning">${this.stats.businesses.pending}</strong></div>
                            <div class="stat-item">تأیید شده: <strong class="text-success">${this.stats.businesses.verified}</strong></div>
                            <div class="stat-item">رد شده: <strong class="text-danger">${this.stats.businesses.rejected}</strong></div>
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <h4>📅 آمار نوبت‌ها</h4>
                        <div class="stats-grid">
                            <div class="stat-item">کل نوبت‌ها: <strong>${this.stats.bookings.total.toLocaleString('fa-IR')}</strong></div>
                            <div class="stat-item">انجام شده: <strong class="text-success">${this.stats.bookings.completed.toLocaleString('fa-IR')}</strong></div>
                            <div class="stat-item">لغو شده: <strong class="text-danger">${this.stats.bookings.cancelled.toLocaleString('fa-IR')}</strong></div>
                            <div class="stat-item">در انتظار: <strong class="text-warning">${this.stats.bookings.pending.toLocaleString('fa-IR')}</strong></div>
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <h4>💰 آمار مالی</h4>
                        <div class="stats-grid">
                            <div class="stat-item">کل درآمد: <strong>${this.formatPrice(this.stats.revenue.total)}</strong></div>
                            <div class="stat-item">درآمد این ماه: <strong>${this.formatPrice(this.stats.revenue.monthly)}</strong></div>
                            <div class="stat-item">درآمد امروز: <strong>${this.formatPrice(this.stats.revenue.daily)}</strong></div>
                            <div class="stat-item">کارمزد پلتفرم: <strong>${this.formatPrice(this.stats.revenue.commission)}</strong></div>
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <h4>🎁 آمار تخفیف‌ها</h4>
                        <div class="stats-grid">
                            <div class="stat-item">تعداد تخفیف‌ها: <strong>${this.stats.discounts.total.toLocaleString('fa-IR')}</strong></div>
                            <div class="stat-item">میانگین درصد: <strong>${this.stats.discounts.averagePercent.toFixed(1)}%</strong></div>
                            <div class="stat-item">کل مبلغ تخفیف: <strong>${this.formatPrice(this.stats.discounts.totalAmount)}</strong></div>
                        </div>
                    </div>
                    
                    <div class="stats-actions">
                        <button class="btn btn-outline" id="exportStatsBtn">📥 خروجی اکسل</button>
                        <button class="btn btn-outline" id="refreshStatsBtn">🔄 به‌روزرسانی</button>
                    </div>
                    
                    <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('refreshStatsBtn')?.addEventListener('click', () => {
            this.loadAllStats();
            modal.remove();
            setTimeout(() => this.showStatsModal(), 100);
            App.showToast('آمار به‌روزرسانی شد', 'success');
        });
        
        document.getElementById('exportStatsBtn')?.addEventListener('click', () => {
            this.exportStatsToCSV();
        });
    },
    
    // ===== خروجی به CSV =====
    exportStatsToCSV: function() {
        const data = [
            ['نوع آمار', 'مقدار'],
            ['--- آمار کاربران ---', ''],
            ['کل کاربران', this.stats.users.total],
            ['کاربران فعال', this.stats.users.active],
            ['کاربران مسدود', this.stats.users.blocked],
            ['جدید این ماه', this.stats.users.newThisMonth],
            ['', ''],
            ['--- آمار کسب‌وکارها ---', ''],
            ['کل کسب‌وکارها', this.stats.businesses.total],
            ['در انتظار تأیید', this.stats.businesses.pending],
            ['تأیید شده', this.stats.businesses.verified],
            ['رد شده', this.stats.businesses.rejected],
            ['', ''],
            ['--- آمار نوبت‌ها ---', ''],
            ['کل نوبت‌ها', this.stats.bookings.total],
            ['انجام شده', this.stats.bookings.completed],
            ['لغو شده', this.stats.bookings.cancelled],
            ['در انتظار', this.stats.bookings.pending],
            ['', ''],
            ['--- آمار مالی ---', ''],
            ['کل درآمد', this.stats.revenue.total],
            ['درآمد این ماه', this.stats.revenue.monthly],
            ['درآمد امروز', this.stats.revenue.daily],
            ['کارمزد پلتفرم', this.stats.revenue.commission],
            ['', ''],
            ['--- آمار تخفیف‌ها ---', ''],
            ['تعداد تخفیف‌ها', this.stats.discounts.total],
            ['میانگین درصد', this.stats.discounts.averagePercent.toFixed(1) + '%'],
            ['کل مبلغ تخفیف', this.stats.discounts.totalAmount]
        ];
        
        const csvRows = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'platform_stats.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        App.showToast('گزارش با موفقیت دانلود شد', 'success');
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

// استایل‌های آمار پلتفرم
const platformStatsStyles = `
<style>
.stats-section {
    margin-bottom: 25px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
}

.stats-section h4 {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.stat-item {
    padding: 8px;
    background: var(--bg-primary);
    border-radius: var(--radius-sm);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stat-item strong {
    font-size: 16px;
}

.text-warning { color: var(--color-warning); }
.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }

.stats-actions {
    display: flex;
    gap: 10px;
    margin: 20px 0;
    justify-content: center;
}
</style>
`;

if (!document.querySelector('#platform-stats-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'platform-stats-styles';
    styleSheet.textContent = platformStatsStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    PlatformStats.init();
});

window.PlatformStats = PlatformStats;
