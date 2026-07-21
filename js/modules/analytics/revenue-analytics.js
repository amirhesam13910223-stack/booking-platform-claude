 /* ============================================
   REVENUE-ANALYTICS.JS - تحلیل درآمد
   ============================================ */

const RevenueAnalytics = {
    // داده‌های درآمد
    revenueData: {
        daily: [],
        weekly: [],
        monthly: [],
        yearly: []
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadRevenueData();
        this.attachEvents();
        console.log('💰 ماژول تحلیل درآمد راه‌اندازی شد');
    },
    
    // ===== بارگذاری داده‌های درآمد =====
    loadRevenueData: function() {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const completedBookings = bookings.filter(b => b.status === 'completed');
        
        // داده‌های روزانه
        const dailyMap = new Map();
        completedBookings.forEach(b => {
            const date = b.date;
            if (!dailyMap.has(date)) dailyMap.set(date, 0);
            dailyMap.set(date, dailyMap.get(date) + (b.finalPrice || 0));
        });
        
        this.revenueData.daily = Array.from(dailyMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // داده‌های هفتگی
        const weeklyMap = new Map();
        completedBookings.forEach(b => {
            const date = new Date(b.date);
            const week = this.getWeekNumber(date);
            const weekKey = `${date.getFullYear()}-W${week}`;
            if (!weeklyMap.has(weekKey)) weeklyMap.set(weekKey, 0);
            weeklyMap.set(weekKey, weeklyMap.get(weekKey) + (b.finalPrice || 0));
        });
        
        this.revenueData.weekly = Array.from(weeklyMap.entries())
            .map(([week, amount]) => ({ week, amount }))
            .slice(-12);
        
        // داده‌های ماهانه
        const monthlyMap = new Map();
        completedBookings.forEach(b => {
            const date = new Date(b.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, 0);
            monthlyMap.set(monthKey, monthlyMap.get(monthKey) + (b.finalPrice || 0));
        });
        
        this.revenueData.monthly = Array.from(monthlyMap.entries())
            .map(([month, amount]) => ({ month, amount }))
            .slice(-12);
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('revenue:analyze', (data) => {
            return this.analyzeRevenue(data);
        });
    },
    
    // ===== تحلیل درآمد =====
    analyzeRevenue: function(data = {}) {
        const { period = 'monthly', compareTo = null } = data;
        
        let currentData = [];
        let previousData = [];
        
        switch(period) {
            case 'daily':
                currentData = this.revenueData.daily.slice(-30);
                if (compareTo) previousData = this.revenueData.daily.slice(-60, -30);
                break;
            case 'weekly':
                currentData = this.revenueData.weekly.slice(-12);
                if (compareTo) previousData = this.revenueData.weekly.slice(-24, -12);
                break;
            case 'monthly':
                currentData = this.revenueData.monthly.slice(-12);
                if (compareTo) previousData = this.revenueData.monthly.slice(-24, -12);
                break;
        }
        
        const currentTotal = currentData.reduce((sum, d) => sum + d.amount, 0);
        const previousTotal = previousData.reduce((sum, d) => sum + d.amount, 0);
        
        const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
        const averageDaily = currentTotal / (currentData.length || 1);
        
        // بهترین و بدترین روز
        let bestDay = { date: '', amount: 0 };
        let worstDay = { date: '', amount: Infinity };
        
        currentData.forEach(d => {
            if (d.amount > bestDay.amount) bestDay = { date: d.date || d.week || d.month, amount: d.amount };
            if (d.amount < worstDay.amount) worstDay = { date: d.date || d.week || d.month, amount: d.amount };
        });
        
        return {
            period: period,
            currentTotal: currentTotal,
            previousTotal: previousTotal,
            growth: growth,
            averageDaily: averageDaily,
            bestDay: bestDay,
            worstDay: worstDay,
            data: currentData,
            trend: this.calculateTrend(currentData.map(d => d.amount)),
            forecast: this.forecastRevenue(currentData)
        };
    },
    
    // ===== محاسبه روند =====
    calculateTrend: function(values) {
        if (values.length < 2) return 'stable';
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        if (change > 10) return 'growing';
        if (change < -10) return 'declining';
        return 'stable';
    },
    
    // ===== پیش‌بینی درآمد =====
    forecastRevenue: function(data, periods = 3) {
        if (data.length < 3) return [];
        
        const values = data.map(d => d.amount);
        const forecast = [];
        
        // میانگین متحرک ساده
        for (let i = 0; i < periods; i++) {
            const avg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
            forecast.push({ period: i + 1, amount: avg });
            values.push(avg);
        }
        
        return forecast;
    },
    
    // ===== دریافت خلاصه درآمد =====
    getRevenueSummary: function() {
        const allBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const completed = allBookings.filter(b => b.status === 'completed');
        
        const total = completed.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
        const totalDiscount = completed.reduce((sum, b) => sum + (b.discount || 0), 0);
        const platformCommission = total * 0.03;
        
        // درآمد امروز
        const today = new Date().toISOString().split('T')[0];
        const todayRevenue = completed
            .filter(b => b.date === today)
            .reduce((sum, b) => sum + (b.finalPrice || 0), 0);
        
        // درآمد این ماه
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyRevenue = completed
            .filter(b => new Date(b.date) >= firstDayOfMonth)
            .reduce((sum, b) => sum + (b.finalPrice || 0), 0);
        
        return {
            totalRevenue: total,
            totalDiscount: totalDiscount,
            platformCommission: platformCommission,
            todayRevenue: todayRevenue,
            monthlyRevenue: monthlyRevenue,
            averagePerBooking: completed.length > 0 ? total / completed.length : 0,
            totalBookings: completed.length
        };
    },
    
    // ===== دریافت درآمد به تفکیک کسب‌وکار =====
    getRevenueByBusiness: function() {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const completed = bookings.filter(b => b.status === 'completed');
        
        const businessMap = new Map();
        completed.forEach(b => {
            const businessId = b.business?.id || 'unknown';
            if (!businessMap.has(businessId)) {
                businessMap.set(businessId, {
                    name: b.business?.name || 'نامشخص',
                    revenue: 0,
                    bookings: 0
                });
            }
            businessMap.get(businessId).revenue += b.finalPrice || 0;
            businessMap.get(businessId).bookings++;
        });
        
        return Array.from(businessMap.values())
            .sort((a, b) => b.revenue - a.revenue);
    },
    
    // ===== دریافت درآمد به تفکیک دسته‌بندی =====
    getRevenueByCategory: function() {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const completed = bookings.filter(b => b.status === 'completed');
        
        const categoryMap = new Map();
        completed.forEach(b => {
            const category = b.service?.category || 'سایر';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    name: category,
                    revenue: 0,
                    bookings: 0
                });
            }
            categoryMap.get(category).revenue += b.finalPrice || 0;
            categoryMap.get(category).bookings++;
        });
        
        return Array.from(categoryMap.values())
            .sort((a, b) => b.revenue - a.revenue);
    },
    
    // ===== نمایش داشبورد درآمد =====
    showRevenueDashboard: function() {
        const summary = this.getRevenueSummary();
        const revenueByBusiness = this.getRevenueByBusiness();
        const revenueByCategory = this.getRevenueByCategory();
        
        const modal = document.createElement('div');
        modal.id = 'revenueDashboard';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>💰 داشبورد درآمد</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="revenue-stats">
                        <div class="stat-card">
                            <div class="stat-value">${this.formatPrice(summary.totalRevenue)}</div>
                            <div class="stat-label">کل درآمد</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.formatPrice(summary.todayRevenue)}</div>
                            <div class="stat-label">درآمد امروز</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.formatPrice(summary.monthlyRevenue)}</div>
                            <div class="stat-label">درآمد این ماه</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.formatPrice(summary.platformCommission)}</div>
                            <div class="stat-label">کارمزد پلتفرم</div>
                        </div>
                    </div>
                    
                    <div class="revenue-charts">
                        <div class="chart-container">
                            <h4>روند درآمد ماهانه</h4>
                            <canvas id="monthlyRevenueChart" width="500" height="250"></canvas>
                        </div>
                        <div class="chart-container">
                            <h4>درآمد به تفکیک دسته‌بندی</h4>
                            <canvas id="categoryRevenueChart" width="400" height="250"></canvas>
                        </div>
                    </div>
                    
                    <div class="revenue-table">
                        <h4>برترین کسب‌وکارها</h4>
                        <div class="table-wrapper">
                            <table class="data-table">
                                <thead>
                                    <tr><th>کسب‌وکار</th><th>تعداد نوبت</th><th>درآمد</th></tr>
                                </thead>
                                <tbody>
                                    ${revenueByBusiness.slice(0, 5).map(b => `
                                        <tr>
                                            <td>${b.name}</td>
                                            <td>${b.bookings}</td>
                                            <td>${this.formatPrice(b.revenue)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // رسم نمودارها
        setTimeout(() => {
            const monthlyData = this.revenueData.monthly.slice(-6);
            if (window.ChartRenderer) {
                window.ChartRenderer.renderLineChart('monthlyRevenueChart', {
                    labels: monthlyData.map(d => d.month),
                    values: monthlyData.map(d => d.amount),
                    title: 'درآمد ماهانه'
                });
                
                window.ChartRenderer.renderPieChart('categoryRevenueChart', {
                    labels: revenueByCategory.map(c => c.name),
                    values: revenueByCategory.map(c => c.revenue)
                });
            }
        }, 100);
    },
    
    // ===== دریافت شماره هفته =====
    getWeekNumber: function(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
        const week1 = new Date(d.getFullYear(), 0, 4);
        return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    RevenueAnalytics.init();
});

window.RevenueAnalytics = RevenueAnalytics;
