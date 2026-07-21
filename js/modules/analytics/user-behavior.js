 /* ============================================
   USER-BEHAVIOR.JS - تحلیل رفتار کاربران
   ============================================ */

const UserBehavior = {
    // داده‌های رفتار کاربران
    behaviorData: {
        pageViews: [],
        clicks: [],
        bookingAttempts: [],
        conversionRates: []
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadBehaviorData();
        this.trackEvents();
        this.attachEvents();
        console.log('👥 ماژول تحلیل رفتار کاربران راه‌اندازی شد');
    },
    
    // ===== بارگذاری داده‌ها =====
    loadBehaviorData: function() {
        const saved = localStorage.getItem('user_behavior_data');
        if (saved) {
            try {
                this.behaviorData = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره داده‌ها =====
    saveBehaviorData: function() {
        localStorage.setItem('user_behavior_data', JSON.stringify(this.behaviorData));
    },
    
    // ===== ردیابی رویدادها =====
    trackEvents: function() {
        // ردیابی بازدید صفحات
        const trackPageView = () => {
            this.behaviorData.pageViews.push({
                page: window.location.pathname,
                timestamp: new Date().toISOString(),
                userId: AuthSession.getUser()?.id || null
            });
            this.saveBehaviorData();
        };
        
        trackPageView();
        
        // ردیابی کلیک‌ها
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a, .clickable');
            if (target) {
                this.behaviorData.clicks.push({
                    element: target.tagName,
                    text: target.innerText?.substring(0, 50),
                    page: window.location.pathname,
                    timestamp: new Date().toISOString(),
                    userId: AuthSession.getUser()?.id || null
                });
                this.saveBehaviorData();
            }
        });
        
        // ردیابی تلاش برای رزرو
        App.on('booking:attempt', (data) => {
            this.behaviorData.bookingAttempts.push({
                ...data,
                timestamp: new Date().toISOString(),
                userId: AuthSession.getUser()?.id || null
            });
            this.saveBehaviorData();
        });
        
        // ردیابی رزرو موفق
        App.on(SystemEvents.BOOKING_CREATED, (booking) => {
            this.calculateConversionRate();
        });
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('behavior:analyze', (data) => {
            return this.analyzeBehavior(data);
        });
    },
    
    // ===== محاسبه نرخ تبدیل =====
    calculateConversionRate: function() {
        const today = new Date().toISOString().split('T')[0];
        const todayAttempts = this.behaviorData.bookingAttempts.filter(a => a.timestamp.startsWith(today)).length;
        const todayBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]')
            .filter(b => b.date === today).length;
        
        const rate = todayAttempts > 0 ? (todayBookings / todayAttempts) * 100 : 0;
        
        this.behaviorData.conversionRates.push({
            date: today,
            attempts: todayAttempts,
            bookings: todayBookings,
            rate: rate
        });
        
        this.saveBehaviorData();
    },
    
    // ===== تحلیل رفتار =====
    analyzeBehavior: function(data = {}) {
        const { period = 'day' } = data;
        
        const now = new Date();
        let filteredAttempts = this.behaviorData.bookingAttempts;
        let filteredConversions = this.behaviorData.conversionRates;
        
        if (period === 'day') {
            const today = now.toISOString().split('T')[0];
            filteredAttempts = filteredAttempts.filter(a => a.timestamp.startsWith(today));
            filteredConversions = filteredConversions.filter(c => c.date === today);
        } else if (period === 'week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            filteredAttempts = filteredAttempts.filter(a => new Date(a.timestamp) >= weekAgo);
            filteredConversions = filteredConversions.filter(c => new Date(c.date) >= weekAgo);
        } else if (period === 'month') {
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            filteredAttempts = filteredAttempts.filter(a => new Date(a.timestamp) >= monthAgo);
            filteredConversions = filteredConversions.filter(c => new Date(c.date) >= monthAgo);
        }
        
        // محبوب‌ترین صفحات
        const pageViews = this.behaviorData.pageViews;
        const popularPages = {};
        pageViews.forEach(view => {
            popularPages[view.page] = (popularPages[view.page] || 0) + 1;
        });
        
        // محبوب‌ترین کلیک‌ها
        const popularClicks = {};
        this.behaviorData.clicks.forEach(click => {
            const key = `${click.element}:${click.text}`;
            popularClicks[key] = (popularClicks[key] || 0) + 1;
        });
        
        const avgConversionRate = filteredConversions.length > 0 
            ? filteredConversions.reduce((sum, c) => sum + c.rate, 0) / filteredConversions.length 
            : 0;
        
        return {
            period: period,
            totalAttempts: filteredAttempts.length,
            totalConversions: filteredConversions.reduce((sum, c) => sum + c.bookings, 0),
            conversionRate: avgConversionRate,
            popularPages: Object.entries(popularPages).sort((a, b) => b[1] - a[1]).slice(0, 5),
            popularClicks: Object.entries(popularClicks).sort((a, b) => b[1] - a[1]).slice(0, 5),
            dailyConversionRates: filteredConversions.slice(-7)
        };
    },
    
    // ===== ردیابی رویداد سفارشی =====
    trackCustomEvent: function(eventName, data = {}) {
        const event = {
            name: eventName,
            data: data,
            timestamp: new Date().toISOString(),
            userId: AuthSession.getUser()?.id || null,
            page: window.location.pathname
        };
        
        const events = JSON.parse(localStorage.getItem('custom_events') || '[]');
        events.push(event);
        localStorage.setItem('custom_events', JSON.stringify(events.slice(-500)));
        
        App.emit('behavior:event-tracked', event);
    },
    
    // ===== نمایش داشبورد رفتار =====
    showBehaviorDashboard: function() {
        const analysis = this.analyzeBehavior({ period: 'month' });
        
        const modal = document.createElement('div');
        modal.id = 'behaviorDashboard';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>👥 تحلیل رفتار کاربران</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="behavior-stats">
                        <div class="stat-card">
                            <div class="stat-value">${analysis.totalAttempts}</div>
                            <div class="stat-label">تلاش برای رزرو</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${analysis.totalConversions}</div>
                            <div class="stat-label">رزرو موفق</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${analysis.conversionRate.toFixed(1)}%</div>
                            <div class="stat-label">نرخ تبدیل</div>
                        </div>
                    </div>
                    
                    <div class="behavior-sections">
                        <div class="behavior-section">
                            <h4>📄 محبوب‌ترین صفحات</h4>
                            <div class="popular-list">
                                ${analysis.popularPages.map(([page, count]) => `
                                    <div class="popular-item">
                                        <span>${page === '/' ? 'خانه' : page}</span>
                                        <span class="count">${count} بازدید</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="behavior-section">
                            <h4>🖱️ محبوب‌ترین کلیک‌ها</h4>
                            <div class="popular-list">
                                ${analysis.popularClicks.map(([click, count]) => `
                                    <div class="popular-item">
                                        <span>${click}</span>
                                        <span class="count">${count} کلیک</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="conversion-chart">
                        <h4>نرخ تبدیل روزانه</h4>
                        <canvas id="conversionRateChart" width="600" height="200"></canvas>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            if (window.ChartRenderer) {
                window.ChartRenderer.renderLineChart('conversionRateChart', {
                    labels: analysis.dailyConversionRates.map(c => c.date),
                    values: analysis.dailyConversionRates.map(c => c.rate),
                    title: 'نرخ تبدیل روزانه (%)'
                });
            }
        }, 100);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UserBehavior.init();
});

window.UserBehavior = UserBehavior;
