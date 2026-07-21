 /* ============================================
   FORECAST-ENGINE.JS - پیش‌بینی هوشمند
   ============================================ */

const ForecastEngine = {
    // داده‌های تاریخی
    historicalData: {
        bookings: [],
        revenue: [],
        users: []
    },
    
    // مدل‌های پیش‌بینی
    models: {
        linear: null,
        seasonal: null,
        movingAverage: null
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadHistoricalData();
        this.trainModels();
        this.attachEvents();
        console.log('🔮 موتور پیش‌بینی هوشمند راه‌اندازی شد');
    },
    
    // ===== بارگذاری داده‌های تاریخی =====
    loadHistoricalData: function() {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const completedBookings = bookings.filter(b => b.status === 'completed');
        
        // گروه‌بندی ماهانه
        const monthlyMap = new Map();
        completedBookings.forEach(b => {
            const date = new Date(b.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, { bookings: 0, revenue: 0 });
            }
            monthlyMap.get(monthKey).bookings++;
            monthlyMap.get(monthKey).revenue += b.finalPrice || 0;
        });
        
        this.historicalData.bookings = Array.from(monthlyMap.entries())
            .map(([month, data]) => ({ month, value: data.bookings }))
            .sort((a, b) => a.month.localeCompare(b.month));
        
        this.historicalData.revenue = Array.from(monthlyMap.entries())
            .map(([month, data]) => ({ month, value: data.revenue }))
            .sort((a, b) => a.month.localeCompare(b.month));
        
        // داده‌های کاربران
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const monthlyUsers = new Map();
        users.forEach(u => {
            const date = new Date(u.createdAt);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            monthlyUsers.set(monthKey, (monthlyUsers.get(monthKey) || 0) + 1);
        });
        
        this.historicalData.users = Array.from(monthlyUsers.entries())
            .map(([month, value]) => ({ month, value }))
            .sort((a, b) => a.month.localeCompare(b.month));
    },
    
    // ===== آموزش مدل‌ها =====
    trainModels: function() {
        // مدل رگرسیون خطی ساده
        this.models.linear = this.trainLinearRegression(this.historicalData.bookings);
        
        // میانگین متحرک
        this.models.movingAverage = this.calculateMovingAverage(this.historicalData.bookings, 3);
    },
    
    // ===== آموزش رگرسیون خطی =====
    trainLinearRegression: function(data) {
        const n = data.length;
        if (n < 2) return { slope: 0, intercept: 0 };
        
        const x = data.map((_, i) => i);
        const y = data.map(d => d.value);
        
        const xMean = x.reduce((a, b) => a + b, 0) / n;
        const yMean = y.reduce((a, b) => a + b, 0) / n;
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < n; i++) {
            numerator += (x[i] - xMean) * (y[i] - yMean);
            denominator += (x[i] - xMean) ** 2;
        }
        
        const slope = denominator !== 0 ? numerator / denominator : 0;
        const intercept = yMean - slope * xMean;
        
        return { slope, intercept };
    },
    
    // ===== محاسبه میانگین متحرک =====
    calculateMovingAverage: function(data, window) {
        const values = data.map(d => d.value);
        const movingAverages = [];
        
        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - window + 1);
            const slice = values.slice(start, i + 1);
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
            movingAverages.push(avg);
        }
        
        return movingAverages;
    },
    
    // ===== پیش‌بینی =====
    forecast: function(metric = 'bookings', periods = 3, method = 'linear') {
        let data = [];
        
        switch(metric) {
            case 'bookings':
                data = this.historicalData.bookings;
                break;
            case 'revenue':
                data = this.historicalData.revenue;
                break;
            case 'users':
                data = this.historicalData.users;
                break;
            default:
                return [];
        }
        
        if (data.length < 2) return [];
        
        const forecasts = [];
        const lastIndex = data.length - 1;
        
        if (method === 'linear') {
            const { slope, intercept } = this.trainLinearRegression(data);
            
            for (let i = 1; i <= periods; i++) {
                const predictedValue = slope * (lastIndex + i) + intercept;
                forecasts.push({
                    period: i,
                    value: Math.max(0, Math.round(predictedValue)),
                    method: 'linear'
                });
            }
        } else if (method === 'movingAverage') {
            const values = data.map(d => d.value);
            const window = 3;
            
            for (let i = 0; i < periods; i++) {
                const recentValues = values.slice(-window);
                const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
                forecasts.push({
                    period: i + 1,
                    value: Math.round(avg),
                    method: 'movingAverage'
                });
                values.push(avg);
            }
        } else if (method === 'seasonal') {
            // تحلیل فصلی ساده
            const seasonalPattern = this.calculateSeasonalPattern(data);
            const lastValue = data[lastIndex].value;
            
            for (let i = 1; i <= periods; i++) {
                const seasonIndex = (lastIndex + i) % seasonalPattern.length;
                const factor = seasonalPattern[seasonIndex] || 1;
                const predictedValue = lastValue * factor;
                forecasts.push({
                    period: i,
                    value: Math.max(0, Math.round(predictedValue)),
                    method: 'seasonal',
                    factor: factor
                });
            }
        }
        
        return forecasts;
    },
    
    // ===== محاسبه الگوی فصلی =====
    calculateSeasonalPattern: function(data) {
        const values = data.map(d => d.value);
        const overallAvg = values.reduce((a, b) => a + b, 0) / values.length;
        
        // الگوی 12 ماهه
        const seasonalFactors = [];
        for (let i = 0; i < 12; i++) {
            const monthlyValues = [];
            for (let j = i; j < values.length; j += 12) {
                monthlyValues.push(values[j]);
            }
            if (monthlyValues.length > 0) {
                const monthlyAvg = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
                seasonalFactors.push(monthlyAvg / overallAvg);
            } else {
                seasonalFactors.push(1);
            }
        }
        
        return seasonalFactors;
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('forecast:generate', (data) => {
            return this.forecast(data.metric, data.periods, data.method);
        });
    },
    
    // ===== پیش‌بینی روزهای شلوغ =====
    predictBusyDays: function(days = 30) {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const completed = bookings.filter(b => b.status === 'completed');
        
        // محاسبه میانگین روزهای هفته
        const weekdayStats = {};
        for (let i = 0; i < 7; i++) {
            weekdayStats[i] = { total: 0, count: 0 };
        }
        
        completed.forEach(b => {
            const date = new Date(b.date);
            const weekday = date.getDay();
            weekdayStats[weekday].total++;
            weekdayStats[weekday].count++;
        });
        
        const weekdayAvg = {};
        for (let i = 0; i < 7; i++) {
            weekdayAvg[i] = weekdayStats[i].count > 0 ? weekdayStats[i].total / weekdayStats[i].count : 0;
        }
        
        // پیش‌بینی روزهای آینده
        const predictions = [];
        const today = new Date();
        
        for (let i = 1; i <= days; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            const weekday = futureDate.getDay();
            const predictedBookings = weekdayAvg[weekday];
            
            predictions.push({
                date: futureDate.toISOString().split('T')[0],
                weekday: this.getWeekdayName(weekday),
                predictedBookings: Math.round(predictedBookings),
                isBusy: predictedBookings > (Object.values(weekdayAvg).reduce((a, b) => a + b, 0) / 7) * 1.2
            });
        }
        
        return predictions;
    },
    
    // ===== دریافت نام روز هفته =====
    getWeekdayName: function(day) {
        const names = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
        return names[day];
    },
    
    // ===== نمایش داشبورد پیش‌بینی =====
    showForecastDashboard: function() {
        const bookingsForecast = this.forecast('bookings', 6, 'linear');
        const revenueForecast = this.forecast('revenue', 6, 'linear');
        const busyDays = this.predictBusyDays(14);
        
        const modal = document.createElement('div');
        modal.id = 'forecastDashboard';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>🔮 پیش‌بینی هوشمند</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="forecast-tabs">
                        <button class="tab-btn active" data-tab="bookings">پیش‌بینی نوبت‌ها</button>
                        <button class="tab-btn" data-tab="revenue">پیش‌بینی درآمد</button>
                        <button class="tab-btn" data-tab="busy">روزهای شلوغ</button>
                    </div>
                    
                    <div id="bookingsTab" class="tab-content active">
                        <div class="forecast-stats">
                            <div class="stat-card">
                                <div class="stat-value">${bookingsForecast.reduce((sum, f) => sum + f.value, 0)}</div>
                                <div class="stat-label">مجموع پیش‌بینی ۶ ماه آینده</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${Math.round(bookingsForecast[0]?.value / (this.historicalData.bookings.slice(-3).reduce((a,b) => a + b.value, 0) / 3) * 100)}%</div>
                                <div class="stat-label">رشد نسبت به میانگین</div>
                            </div>
                        </div>
                        <div class="forecast-chart">
                            <canvas id="bookingsForecastChart" width="600" height="250"></canvas>
                        </div>
                        <div class="forecast-table">
                            <table class="data-table">
                                <thead><tr><th>ماه</th><th>پیش‌بینی نوبت</th></tr></thead>
                                <tbody>
                                    ${bookingsForecast.map((f, i) => `
                                        <tr><td>ماه ${i + 1}</td><td>${f.value.toLocaleString('fa-IR')}</td></tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div id="revenueTab" class="tab-content">
                        <div class="forecast-stats">
                            <div class="stat-card">
                                <div class="stat-value">${this.formatPrice(revenueForecast.reduce((sum, f) => sum + f.value, 0))}</div>
                                <div class="stat-label">مجموع پیش‌بینی ۶ ماه آینده</div>
                            </div>
                        </div>
                        <div class="forecast-chart">
                            <canvas id="revenueForecastChart" width="600" height="250"></canvas>
                        </div>
                        <div class="forecast-table">
                            <table class="data-table">
                                <thead><tr><th>ماه</th><th>پیش‌بینی درآمد</th></tr></thead>
                                <tbody>
                                    ${revenueForecast.map((f, i) => `
                                        <tr><td>ماه ${i + 1}</td><td>${this.formatPrice(f.value)}</td></tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div id="busyTab" class="tab-content">
                        <div class="busy-days-list">
                            <div class="busy-header">
                                <span>تاریخ</span>
                                <span>روز هفته</span>
                                <span>پیش‌بینی</span>
                                <span>وضعیت</span>
                            </div>
                            ${busyDays.map(day => `
                                <div class="busy-row ${day.isBusy ? 'busy' : ''}">
                                    <span>${day.date}</span>
                                    <span>${day.weekday}</span>
                                    <span>${Math.round(day.predictedBookings)} نوبت</span>
                                    <span class="${day.isBusy ? 'busy-badge' : 'normal-badge'}">
                                        ${day.isBusy ? '🔥 شلوغ' : '⚡ عادی'}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="recommendations-box">
                            <h4>💡 توصیه‌ها</h4>
                            <ul>
                                <li>برای روزهای شلوغ، کارکنان بیشتری برنامه‌ریزی کنید</li>
                                <li>در روزهای کم‌بازده، تخفیف‌های ویژه ارائه دهید</li>
                                <li>سیستم رزرو خودکار را در ساعات اوج فعال کنید</li>
                            </ul>
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // تب‌ها
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`${tab}Tab`).classList.add('active');
            });
        });
        
        // رسم نمودارها
        setTimeout(() => {
            if (window.ChartRenderer) {
                const historicalBookings = this.historicalData.bookings.slice(-6).map(d => d.value);
                const forecastValues = bookingsForecast.map(f => f.value);
                
                window.ChartRenderer.renderLineChart('bookingsForecastChart', {
                    labels: ['ماه -5', 'ماه -4', 'ماه -3', 'ماه -2', 'ماه -1', 'فعلی', 'ماه +1', 'ماه +2', 'ماه +3', 'ماه +4', 'ماه +5', 'ماه +6'],
                    values: [...historicalBookings, ...forecastValues],
                    title: 'پیش‌بینی تعداد نوبت‌ها'
                });
                
                const historicalRevenue = this.historicalData.revenue.slice(-6).map(d => d.value);
                const forecastRevenue = revenueForecast.map(f => f.value);
                
                window.ChartRenderer.renderLineChart('revenueForecastChart', {
                    labels: ['ماه -5', 'ماه -4', 'ماه -3', 'ماه -2', 'ماه -1', 'فعلی', 'ماه +1', 'ماه +2', 'ماه +3', 'ماه +4', 'ماه +5', 'ماه +6'],
                    values: [...historicalRevenue, ...forecastRevenue],
                    title: 'پیش‌بینی درآمد'
                });
            }
        }, 100);
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ForecastEngine.init();
});

window.ForecastEngine = ForecastEngine;
