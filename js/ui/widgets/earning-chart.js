 /* ============================================
   EARNING-CHART.JS - ویجت نمودار درآمد
   ============================================ */

const EarningChartWidget = {
    // ===== ایجاد ویجت نمودار درآمد =====
    create: function(container, options = {}) {
        const {
            data = [],
            type = 'line', // line, bar, area
            period = 'monthly',
            height = 300,
            showLegend = true,
            onPeriodChange = null
        } = options;
        
        this.container = container;
        this.data = data;
        this.type = type;
        this.period = period;
        this.height = height;
        this.showLegend = showLegend;
        this.onPeriodChange = onPeriodChange;
        
        this.render();
        this.drawChart();
        
        return this;
    },
    
    // ===== رندر ویجت =====
    render: function() {
        this.container.innerHTML = `
            <div class="earning-chart-widget">
                <div class="chart-header">
                    <h3>📊 درآمد ${this.getPeriodTitle()}</h3>
                    <div class="chart-period-selector">
                        <button class="period-btn ${this.period === 'daily' ? 'active' : ''}" data-period="daily">روزانه</button>
                        <button class="period-btn ${this.period === 'weekly' ? 'active' : ''}" data-period="weekly">هفتگی</button>
                        <button class="period-btn ${this.period === 'monthly' ? 'active' : ''}" data-period="monthly">ماهانه</button>
                        <button class="period-btn ${this.period === 'yearly' ? 'active' : ''}" data-period="yearly">سالانه</button>
                    </div>
                </div>
                <div class="chart-stats">
                    <div class="stat-card">
                        <div class="stat-label">کل درآمد</div>
                        <div class="stat-value">${PriceHelper.formatPrice(this.getTotalRevenue())}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">میانگین روزانه</div>
                        <div class="stat-value">${PriceHelper.formatPrice(this.getAverageRevenue())}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">رشد نسبت به دوره قبل</div>
                        <div class="stat-value ${this.getGrowth() >= 0 ? 'positive' : 'negative'}">
                            ${this.getGrowth() >= 0 ? '+' : ''}${this.getGrowth().toFixed(1)}%
                        </div>
                    </div>
                </div>
                <canvas id="earning-canvas" height="${this.height}"></canvas>
                ${this.showLegend ? this.renderLegend() : ''}
            </div>
        `;
        
        // اتصال رویدادها
        this.container.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                if (this.onPeriodChange) {
                    this.onPeriodChange(period);
                }
            });
        });
    },
    
    // ===== رسم نمودار =====
    drawChart: function() {
        const canvas = document.getElementById('earning-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth - 40;
        canvas.width = width;
        canvas.height = this.height;
        
        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = this.height - padding.top - padding.bottom;
        
        const values = this.data.map(d => d.amount);
        const maxValue = Math.max(...values, 1);
        
        ctx.clearRect(0, 0, width, this.height);
        
        // رسم محورها
        ctx.beginPath();
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, this.height - padding.bottom);
        ctx.lineTo(width - padding.right, this.height - padding.bottom);
        ctx.stroke();
        
        // رسم خطوط راهنما
        ctx.beginPath();
        ctx.strokeStyle = '#F3F4F6';
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }
        
        // رسم مقادیر محور Y
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px Vazir';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = (maxValue / 4) * (4 - i);
            ctx.fillText(PriceHelper.formatPrice(value), padding.left - 5, padding.top + (chartHeight / 4) * i + 3);
        }
        
        // رسم برچسب‌های محور X
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px Vazir';
        ctx.textAlign = 'center';
        const step = chartWidth / (this.data.length - 1);
        
        this.data.forEach((item, i) => {
            const x = padding.left + step * i;
            let label = '';
            if (this.period === 'daily') label = item.date?.slice(5);
            else if (this.period === 'weekly') label = `هفته ${i + 1}`;
            else if (this.period === 'monthly') label = item.month;
            else label = item.year;
            
            ctx.fillText(label, x, this.height - padding.bottom + 15);
        });
        
        // رسم نمودار
        ctx.beginPath();
        
        if (this.type === 'line') {
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;
            
            this.data.forEach((item, i) => {
                const x = padding.left + step * i;
                const y = padding.top + chartHeight - (item.amount / maxValue) * chartHeight;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            
            // نقاط
            this.data.forEach((item, i) => {
                const x = padding.left + step * i;
                const y = padding.top + chartHeight - (item.amount / maxValue) * chartHeight;
                
                ctx.beginPath();
                ctx.fillStyle = '#3B82F6';
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.fillStyle = 'white';
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (this.type === 'bar') {
            const barWidth = (chartWidth / this.data.length) - 5;
            
            this.data.forEach((item, i) => {
                const barHeight = (item.amount / maxValue) * chartHeight;
                const x = padding.left + i * (barWidth + 5);
                const y = this.height - padding.bottom - barHeight;
                
                ctx.fillStyle = '#3B82F6';
                ctx.fillRect(x, y, barWidth, barHeight);
                
                ctx.fillStyle = '#1F2937';
                ctx.font = '10px Vazir';
                ctx.fillText(PriceHelper.formatPrice(item.amount), x + barWidth / 2, y - 5);
            });
        }
    },
    
    // ===== رندر راهنما =====
    renderLegend: function() {
        return `
            <div class="chart-legend">
                <div class="legend-item">
                    <span class="legend-color" style="background: #3B82F6;"></span>
                    <span>درآمد</span>
                </div>
            </div>
        `;
    },
    
    // ===== دریافت عنوان دوره =====
    getPeriodTitle: function() {
        const titles = {
            daily: 'روزانه',
            weekly: 'هفتگی',
            monthly: 'ماهانه',
            yearly: 'سالانه'
        };
        return titles[this.period] || 'ماهانه';
    },
    
    // ===== کل درآمد =====
    getTotalRevenue: function() {
        return this.data.reduce((sum, d) => sum + d.amount, 0);
    },
    
    // ===== میانگین درآمد =====
    getAverageRevenue: function() {
        if (this.data.length === 0) return 0;
        return this.getTotalRevenue() / this.data.length;
    },
    
    // ===== رشد =====
    getGrowth: function() {
        if (this.data.length < 2) return 0;
        const current = this.data[this.data.length - 1]?.amount || 0;
        const previous = this.data[this.data.length - 2]?.amount || 1;
        return ((current - previous) / previous) * 100;
    },
    
    // ===== به‌روزرسانی داده =====
    updateData: function(data, period) {
        this.data = data;
        this.period = period;
        this.render();
        this.drawChart();
    }
};

// استایل‌های نمودار درآمد
const earningChartStyles = `
<style>
.earning-chart-widget {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    padding: 1rem;
    border: 1px solid var(--border-color);
}
.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
}
.chart-header h3 {
    margin: 0;
    font-size: 1.125rem;
}
.chart-period-selector {
    display: flex;
    gap: 0.25rem;
    background: var(--bg-secondary);
    padding: 0.25rem;
    border-radius: var(--radius-full);
}
.period-btn {
    padding: 0.25rem 0.75rem;
    border: none;
    background: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    font-size: 0.75rem;
    transition: all var(--transition-fast);
}
.period-btn.active {
    background: var(--color-primary);
    color: white;
}
.chart-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
}
.chart-stats .stat-card {
    text-align: center;
    padding: 0.5rem;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
}
.stat-label {
    font-size: 0.75rem;
    color: var(--text-tertiary);
}
.stat-value {
    font-size: 1rem;
    font-weight: bold;
}
.stat-value.positive {
    color: var(--color-success);
}
.stat-value.negative {
    color: var(--color-danger);
}
.chart-legend {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.legend-color {
    width: 16px;
    height: 16px;
    border-radius: 4px;
}
</style>
`;

if (!document.querySelector('#earning-chart-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'earning-chart-styles';
    styleSheet.textContent = earningChartStyles;
    document.head.appendChild(styleSheet);
}

window.EarningChartWidget = EarningChartWidget;
