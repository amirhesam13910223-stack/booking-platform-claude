 /* ============================================
   PEAK-HOURS.JS - تحلیل ساعات اوج
   ============================================ */

const PeakHours = {
    // داده‌های ساعات
    hourlyData: {},
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadHourlyData();
        this.attachEvents();
        console.log('⏰ ماژول تحلیل ساعات اوج راه‌اندازی شد');
    },
    
    // ===== بارگذاری داده‌های ساعتی =====
    loadHourlyData: function() {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const completed = bookings.filter(b => b.status === 'completed');
        
        // مقداردهی اولیه
        for (let i = 0; i < 24; i++) {
            this.hourlyData[i] = { count: 0, revenue: 0 };
        }
        
        completed.forEach(b => {
            const hour = parseInt(b.time.split(':')[0]);
            if (this.hourlyData[hour]) {
                this.hourlyData[hour].count++;
                this.hourlyData[hour].revenue += b.finalPrice || 0;
            }
        });
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('peak-hours:analyze', () => {
            return this.analyzePeakHours();
        });
    },
    
    // ===== تحلیل ساعات اوج =====
    analyzePeakHours: function() {
        const hours = [];
        for (let i = 0; i < 24; i++) {
            hours.push({
                hour: i,
                count: this.hourlyData[i].count,
                revenue: this.hourlyData[i].revenue
            });
        }
        
        hours.sort((a, b) => b.count - a.count);
        
        const peakHours = hours.slice(0, 3);
        const quietHours = hours.slice(-3);
        
        const totalBookings = hours.reduce((sum, h) => sum + h.count, 0);
        const peakBookings = peakHours.reduce((sum, h) => sum + h.count, 0);
        const peakPercentage = totalBookings > 0 ? (peakBookings / totalBookings) * 100 : 0;
        
        return {
            peakHours: peakHours.map(h => ({ hour: h.hour, count: h.count, revenue: h.revenue })),
            quietHours: quietHours.map(h => ({ hour: h.hour, count: h.count, revenue: h.revenue })),
            peakPercentage: peakPercentage,
            hourlyData: hours,
            recommendations: this.getRecommendations(peakHours, quietHours)
        };
    },
    
    // ===== دریافت توصیه‌ها =====
    getRecommendations: function(peakHours, quietHours) {
        const recommendations = [];
        
        if (peakHours.length > 0 && peakHours[0].count > 0) {
            recommendations.push(`ساعات اوج: ${peakHours.map(h => h.hour).join(', ')} - این ساعات را برای تخفیف‌های ویژه در نظر بگیرید`);
        }
        
        if (quietHours.length > 0) {
            recommendations.push(`ساعات خلوت: ${quietHours.map(h => h.hour).join(', ')} - پیشنهاد تخفیف برای جذب مشتری در این ساعات`);
        }
        
        recommendations.push('سیستم رزرو خودکار را در ساعات اوج فعال کنید');
        
        return recommendations;
    },
    
    // ===== دریافت پیشنهاد قیمت پویا =====
    getDynamicPricing: function() {
        const analysis = this.analyzePeakHours();
        const pricing = {};
        
        for (let i = 0; i < 24; i++) {
            let multiplier = 1;
            
            if (analysis.peakHours.some(h => h.hour === i)) {
                multiplier = 1.2; // 20% افزایش در ساعات اوج
            } else if (analysis.quietHours.some(h => h.hour === i)) {
                multiplier = 0.8; // 20% تخفیف در ساعات خلوت
            }
            
            pricing[i] = multiplier;
        }
        
        return pricing;
    },
    
    // ===== نمایش داشبورد ساعات اوج =====
    showPeakHoursDashboard: function() {
        const analysis = this.analyzePeakHours();
        
        const modal = document.createElement('div');
        modal.id = 'peakHoursDashboard';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>⏰ تحلیل ساعات اوج</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="peak-stats">
                        <div class="stat-card">
                            <div class="stat-value">${analysis.peakHours.map(h => h.hour).join(', ')}</div>
                            <div class="stat-label">ساعات اوج</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${analysis.peakPercentage.toFixed(1)}%</div>
                            <div class="stat-label">درصد نوبت‌ها در ساعات اوج</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${analysis.quietHours.map(h => h.hour).join(', ')}</div>
                            <div class="stat-label">ساعات خلوت</div>
                        </div>
                    </div>
                    
                    <div class="peak-chart">
                        <h4>توزیع نوبت‌ها در ساعات مختلف روز</h4>
                        <canvas id="peakHoursChart" width="700" height="300"></canvas>
                    </div>
                    
                    <div class="recommendations">
                        <h4>💡 توصیه‌ها</h4>
                        <ul>
                            ${analysis.recommendations.map(r => `<li>${r}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="dynamic-pricing">
                        <h4>💰 پیشنهاد قیمت پویا</h4>
                        <div class="pricing-grid">
                            ${Object.entries(this.getDynamicPricing()).slice(8, 20).map(([hour, multiplier]) => `
                                <div class="pricing-item">
                                    <span>ساعت ${hour}</span>
                                    <span class="${multiplier > 1 ? 'increase' : multiplier < 1 ? 'decrease' : ''}">
                                        ${multiplier > 1 ? '+' : ''}${Math.round((multiplier - 1) * 100)}%
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            if (window.ChartRenderer) {
                window.ChartRenderer.renderBarChart('peakHoursChart', {
                    labels: analysis.hourlyData.slice(8, 20).map(h => `${h.hour}:00`),
                    values: analysis.hourlyData.slice(8, 20).map(h => h.count),
                    title: 'توزیع نوبت‌ها در ساعات مختلف'
                });
            }
        }, 100);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PeakHours.init();
});

window.PeakHours = PeakHours;
