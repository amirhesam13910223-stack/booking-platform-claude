/* ============================================
   ADMIN-DASHBOARD.JS - داشبورد مدیریت پلتفرم
   ============================================ */

   const AdminDashboard = {
    // آمار کلی پلتفرم
    platformStats: {
        totalUsers: 0,
        totalBusinesses: 0,
        totalBookings: 0,
        totalRevenue: 0,
        platformCommission: 0,
        activeUsers: 0,
        pendingBusinesses: 0,
        todayBookings: 0
    },
    
    // نمودارها
    charts: {},
    
    // ===== مقداردهی اولیه =====
    init: function() {
        const user = AuthSession.getUser();
        if (!user || user.role !== 'admin') {
            console.warn('دسترسی غیرمجاز به پنل ادمین');
            return;
        }
        
        this.loadStats();
        this.attachEvents();
        this.initCharts();
        console.log('👑 داشبورد ادمین راه‌اندازی شد');
    },
    
    // ===== بارگذاری آمار =====
    loadStats: function() {
        // دریافت کاربران
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        this.platformStats.totalUsers = users.length;
        this.platformStats.activeUsers = users.filter(u => u.active !== false).length;
        
        // دریافت کسب‌وکارها
        const businesses = JSON.parse(localStorage.getItem('businesses_list') || '[]');
        this.platformStats.totalBusinesses = businesses.length;
        this.platformStats.pendingBusinesses = businesses.filter(b => b.status === 'pending').length;
        
        // دریافت نوبت‌ها
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        this.platformStats.totalBookings = bookings.length;
        
        // نوبت‌های امروز
        const today = new Date().toISOString().split('T')[0];
        this.platformStats.todayBookings = bookings.filter(b => b.date === today).length;
        
        // محاسبه درآمد
        const completedBookings = bookings.filter(b => b.status === 'completed');
        this.platformStats.totalRevenue = completedBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
        
        // کارمزد پلتفرم (۳٪)
        this.platformStats.platformCommission = this.platformStats.totalRevenue * 0.03;
        
        this.updateDashboardUI();
    },
    
    // ===== به‌روزرسانی UI داشبورد =====
    updateDashboardUI: function() {
        const elements = {
            totalUsers: document.getElementById('adminTotalUsers'),
            totalBusinesses: document.getElementById('adminTotalBusinesses'),
            totalBookings: document.getElementById('adminTotalBookings'),
            totalRevenue: document.getElementById('adminTotalRevenue'),
            platformCommission: document.getElementById('adminPlatformCommission'),
            activeUsers: document.getElementById('adminActiveUsers'),
            pendingBusinesses: document.getElementById('adminPendingBusinesses'),
            todayBookings: document.getElementById('adminTodayBookings')
        };
        
        if (elements.totalUsers) elements.totalUsers.textContent = this.platformStats.totalUsers.toLocaleString('fa-IR');
        if (elements.totalBusinesses) elements.totalBusinesses.textContent = this.platformStats.totalBusinesses.toLocaleString('fa-IR');
        if (elements.totalBookings) elements.totalBookings.textContent = this.platformStats.totalBookings.toLocaleString('fa-IR');
        if (elements.totalRevenue) elements.totalRevenue.textContent = this.formatPrice(this.platformStats.totalRevenue);
        if (elements.platformCommission) elements.platformCommission.textContent = this.formatPrice(this.platformStats.platformCommission);
        if (elements.activeUsers) elements.activeUsers.textContent = this.platformStats.activeUsers.toLocaleString('fa-IR');
        if (elements.pendingBusinesses) elements.pendingBusinesses.textContent = this.platformStats.pendingBusinesses;
        if (elements.todayBookings) elements.todayBookings.textContent = this.platformStats.todayBookings;
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('admin:refresh-stats', () => {
            this.loadStats();
            this.refreshCharts();
        });
        
        App.on('user:registered', () => {
            this.loadStats();
        });
        
        App.on('business:registered', () => {
            this.loadStats();
        });
    },
    
    // ===== راه‌اندازی نمودارها =====
    initCharts: function() {
        this.renderWeeklyChart();
        this.renderRevenueChart();
        this.renderCategoryChart();
    },
    
    // ===== به‌روزرسانی نمودارها =====
    refreshCharts: function() {
        this.renderWeeklyChart();
        this.renderRevenueChart();
        this.renderCategoryChart();
    },
    
    // ===== نمودار نوبت‌های هفتگی =====
    renderWeeklyChart: function() {
        const canvas = document.getElementById('adminWeeklyChart');
        if (!canvas) return;
        
        // داده‌های نمونه
        const data = [45, 52, 48, 61, 55, 67, 42];
        const labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = canvas.offsetWidth;
            canvas.height = 200;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width - 60) / data.length - 5;
            const maxValue = Math.max(...data);
            
            data.forEach((value, index) => {
                const height = (value / maxValue) * (canvas.height - 60);
                const x = 30 + index * (barWidth + 5);
                const y = canvas.height - 30 - height;
                
                ctx.fillStyle = '#3B82F6';
                ctx.fillRect(x, y, barWidth, height);
                
                ctx.fillStyle = '#666';
                ctx.font = '10px Vazir';
                ctx.fillText(labels[index], x + barWidth/2 - 10, canvas.height - 15);
                ctx.fillText(value, x + barWidth/2 - 8, y - 5);
            });
        }
    },
    
    // ===== نمودار درآمد ماهانه =====
    renderRevenueChart: function() {
        const canvas = document.getElementById('adminRevenueChart');
        if (!canvas) return;
        
        const data = [12, 19, 15, 17, 14, 22, 18, 21, 24, 28, 26, 30];
        const labels = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = canvas.offsetWidth;
            canvas.height = 200;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width - 60) / data.length - 2;
            const maxValue = Math.max(...data);
            
            data.forEach((value, index) => {
                const height = (value / maxValue) * (canvas.height - 60);
                const x = 30 + index * (barWidth + 2);
                const y = canvas.height - 30 - height;
                
                const gradient = ctx.createLinearGradient(x, y, x, y + height);
                gradient.addColorStop(0, '#10B981');
                gradient.addColorStop(1, '#3B82F6');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth, height);
                
                if (index % 2 === 0) {
                    ctx.fillStyle = '#666';
                    ctx.font = '8px Vazir';
                    ctx.fillText(labels[index], x + barWidth/2 - 8, canvas.height - 15);
                }
            });
        }
    },
    
    // ===== نمودار دسته‌بندی خدمات =====
    renderCategoryChart: function() {
        const canvas = document.getElementById('adminCategoryChart');
        if (!canvas) return;
        
        const categories = ['آرایشی', 'پزشکی', 'مراقبتی', 'ورزشی', 'سایر'];
        const values = [45, 30, 15, 8, 2];
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = canvas.offsetWidth;
            canvas.height = 200;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const total = values.reduce((a, b) => a + b, 0);
            let startAngle = -Math.PI / 2;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 10;
            
            values.forEach((value, index) => {
                const angle = (value / total) * Math.PI * 2;
                const endAngle = startAngle + angle;
                
                ctx.beginPath();
                ctx.fillStyle = colors[index];
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.fill();
                
                startAngle = endAngle;
            });
            
            // راهنما
            let legendY = 10;
            categories.forEach((cat, index) => {
                ctx.fillStyle = colors[index];
                ctx.fillRect(canvas.width - 100, legendY, 12, 12);
                ctx.fillStyle = '#666';
                ctx.font = '10px Vazir';
                ctx.fillText(cat, canvas.width - 85, legendY + 10);
                legendY += 18;
            });
        }
    },
    
    // ===== نمایش مودال داشبورد ادمین =====
    showAdminDashboard: function() {
        const modal = document.createElement('div');
        modal.id = 'adminDashboardModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>👑 داشبورد مدیریت پلتفرم</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="admin-stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="adminTotalUsers">${this.platformStats.totalUsers.toLocaleString('fa-IR')}</div>
                            <div class="stat-label">کل کاربران</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="adminTotalBusinesses">${this.platformStats.totalBusinesses.toLocaleString('fa-IR')}</div>
                            <div class="stat-label">کسب‌وکارها</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="adminTotalBookings">${this.platformStats.totalBookings.toLocaleString('fa-IR')}</div>
                            <div class="stat-label">کل نوبت‌ها</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="adminTotalRevenue">${this.formatPrice(this.platformStats.totalRevenue)}</div>
                            <div class="stat-label">درآمد کل</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="adminPlatformCommission">${this.formatPrice(this.platformStats.platformCommission)}</div>
                            <div class="stat-label">کارمزد پلتفرم</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="adminActiveUsers">${this.platformStats.activeUsers.toLocaleString('fa-IR')}</div>
                            <div class="stat-label">کاربران فعال</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="adminPendingBusinesses">${this.platformStats.pendingBusinesses}</div>
                            <div class="stat-label">در انتظار تأیید</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="adminTodayBookings">${this.platformStats.todayBookings}</div>
                            <div class="stat-label">نوبت‌های امروز</div>
                        </div>
                    </div>
                    
                    <div class="admin-charts">
                        <div class="chart-box">
                            <h4>نوبت‌های هفتگی</h4>
                            <canvas id="adminWeeklyChart" width="400" height="200"></canvas>
                        </div>
                        <div class="chart-box">
                            <h4>درآمد ماهانه (میلیون تومان)</h4>
                            <canvas id="adminRevenueChart" width="400" height="200"></canvas>
                        </div>
                        <div class="chart-box">
                            <h4>دسته‌بندی خدمات</h4>
                            <canvas id="adminCategoryChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                    
                    <div class="admin-actions">
                        <button class="btn btn-outline" id="manageUsersBtn">👥 مدیریت کاربران</button>
                        <button class="btn btn-outline" id="verifyBusinessesBtn">🏢 تأیید کسب‌وکارها</button>
                        <button class="btn btn-outline" id="viewPlatformStatsBtn">📊 آمار کامل</button>
                        <button class="btn btn-outline" id="manageCommissionBtn">💰 مدیریت کارمزد</button>
                    </div>
                    
                    <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // راه‌اندازی نمودارها
        setTimeout(() => {
            this.renderWeeklyChart();
            this.renderRevenueChart();
            this.renderCategoryChart();
        }, 100);
        
        // دکمه‌های مدیریت
        document.getElementById('manageUsersBtn')?.addEventListener('click', () => {
            if (window.UserManager) {
                modal.remove();
                window.UserManager.showUserManager();
            }
        });
        
        document.getElementById('verifyBusinessesBtn')?.addEventListener('click', () => {
            if (window.BusinessVerifier) {
                modal.remove();
                window.BusinessVerifier.showVerificationPanel();
            }
        });
        
        document.getElementById('viewPlatformStatsBtn')?.addEventListener('click', () => {
            if (window.PlatformStats) {
                modal.remove();
                window.PlatformStats.showStatsModal();
            }
        });
        
        document.getElementById('manageCommissionBtn')?.addEventListener('click', () => {
            if (window.CommissionManager) {
                modal.remove();
                window.CommissionManager.showCommissionModal();
            }
        });
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

// استایل‌های داشبورد ادمین
const adminDashboardStyles = `
<style>
.admin-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 30px;
}

.admin-stats-grid .stat-card {
    text-align: center;
    padding: 15px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: var(--radius-lg);
    color: white;
}

.admin-stats-grid .stat-value {
    font-size: 22px;
    font-weight: bold;
}

.admin-stats-grid .stat-label {
    font-size: 12px;
    opacity: 0.9;
    margin-top: 5px;
}

.admin-charts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 30px;
}

.chart-box {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    text-align: center;
}

.chart-box h4 {
    margin-bottom: 10px;
    font-size: 14px;
}

.chart-box canvas {
    width: 100%;
    height: auto;
    background: white;
    border-radius: var(--radius-sm);
}

.admin-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 20px;
}

@media (max-width: 768px) {
    .admin-stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .admin-charts {
        grid-template-columns: 1fr;
    }
    
    .admin-actions {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
`;

if (!document.querySelector('#admin-dashboard-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'admin-dashboard-styles';
    styleSheet.textContent = adminDashboardStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    AdminDashboard.init();
});

window.AdminDashboard = AdminDashboard; 
