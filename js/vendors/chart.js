 /* ============================================
   CHART.JS - کتابخانه ساده رسم نمودار
   ============================================ */

class SimpleChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.options = {
            width: options.width || 600,
            height: options.height || 400,
            backgroundColor: options.backgroundColor || '#FFFFFF',
            gridColor: options.gridColor || '#E5E7EB',
            textColor: options.textColor || '#6B7280',
            fontFamily: options.fontFamily || 'Vazir, Tahoma',
            ...options
        };
        
        this.setDimensions();
    }
    
    setDimensions() {
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.style.width = `${this.options.width}px`;
        this.canvas.style.height = `${this.options.height}px`;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawGrid(padding, chartWidth, chartHeight) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.options.gridColor;
        this.ctx.lineWidth = 0.5;
        
        // خطوط عمودی
        for (let i = 0; i <= 4; i++) {
            const x = padding.left + (chartWidth / 4) * i;
            this.ctx.moveTo(x, padding.top);
            this.ctx.lineTo(x, this.canvas.height - padding.bottom);
            this.ctx.stroke();
        }
        
        // خطوط افقی
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            this.ctx.moveTo(padding.left, y);
            this.ctx.lineTo(this.canvas.width - padding.right, y);
            this.ctx.stroke();
        }
    }
    
    drawAxes(padding) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.options.gridColor;
        this.ctx.lineWidth = 1;
        
        // محور Y
        this.ctx.moveTo(padding.left, padding.top);
        this.ctx.lineTo(padding.left, this.canvas.height - padding.bottom);
        
        // محور X
        this.ctx.moveTo(padding.left, this.canvas.height - padding.bottom);
        this.ctx.lineTo(this.canvas.width - padding.right, this.canvas.height - padding.bottom);
        
        this.ctx.stroke();
    }
    
    drawLabels(labels, values, padding, chartWidth, chartHeight, maxValue) {
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = `10px ${this.options.fontFamily}`;
        this.ctx.textAlign = 'center';
        
        // برچسب‌های محور X
        const step = chartWidth / (labels.length - 1);
        labels.forEach((label, i) => {
            const x = padding.left + step * i;
            this.ctx.fillText(label, x, this.canvas.height - padding.bottom + 15);
        });
        
        // مقادیر محور Y
        this.ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = (maxValue / 4) * (4 - i);
            const y = padding.top + (chartHeight / 4) * i;
            this.ctx.fillText(this.formatValue(value), padding.left - 5, y + 3);
        }
    }
    
    formatValue(value) {
        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
        if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
        return value.toString();
    }
    
    // ===== نمودار خطی =====
    lineChart(data, options = {}) {
        this.clear();
        
        const { labels = [], values = [], color = '#3B82F6', title = '' } = data;
        const { showPoints = true, fill = false } = options;
        
        if (labels.length === 0 || values.length === 0) {
            this.drawEmptyState();
            return;
        }
        
        const padding = { top: 40, right: 30, bottom: 50, left: 60 };
        const chartWidth = this.canvas.width - padding.left - padding.right;
        const chartHeight = this.canvas.height - padding.top - padding.bottom;
        
        const maxValue = Math.max(...values, 1);
        
        this.drawGrid(padding, chartWidth, chartHeight);
        this.drawAxes(padding);
        
        // عنوان
        if (title) {
            this.ctx.fillStyle = '#1F2937';
            this.ctx.font = `bold 14px ${this.options.fontFamily}`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(title, this.canvas.width / 2, padding.top - 10);
        }
        
        this.drawLabels(labels, values, padding, chartWidth, chartHeight, maxValue);
        
        // رسم خط
        const step = chartWidth / (labels.length - 1);
        const points = [];
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        
        values.forEach((value, i) => {
            const x = padding.left + step * i;
            const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
            points.push({ x, y });
            
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();
        
        // پر کردن زیر خط
        if (fill) {
            this.ctx.lineTo(points[points.length - 1].x, this.canvas.height - padding.bottom);
            this.ctx.lineTo(points[0].x, this.canvas.height - padding.bottom);
            this.ctx.fillStyle = `${color}20`;
            this.ctx.fill();
        }
        
        // نقاط
        if (showPoints) {
            points.forEach(point => {
                this.ctx.beginPath();
                this.ctx.fillStyle = color;
                this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.fillStyle = 'white';
                this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
    }
    
    // ===== نمودار میله‌ای =====
    barChart(data, options = {}) {
        this.clear();
        
        const { labels = [], values = [], colors = [], title = '' } = data;
        const { horizontal = false, showValues = true } = options;
        
        if (labels.length === 0 || values.length === 0) {
            this.drawEmptyState();
            return;
        }
        
        const padding = { top: 40, right: 30, bottom: 50, left: 60 };
        const chartWidth = this.canvas.width - padding.left - padding.right;
        const chartHeight = this.canvas.height - padding.top - padding.bottom;
        
        const maxValue = Math.max(...values, 1);
        
        this.drawGrid(padding, chartWidth, chartHeight);
        this.drawAxes(padding);
        
        // عنوان
        if (title) {
            this.ctx.fillStyle = '#1F2937';
            this.ctx.font = `bold 14px ${this.options.fontFamily}`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(title, this.canvas.width / 2, padding.top - 10);
        }
        
        this.drawLabels(labels, values, padding, chartWidth, chartHeight, maxValue);
        
        if (horizontal) {
            const barHeight = chartHeight / labels.length - 5;
            
            labels.forEach((label, i) => {
                const barWidth = (values[i] / maxValue) * chartWidth;
                const x = padding.left;
                const y = padding.top + i * (barHeight + 5);
                
                this.ctx.fillStyle = colors[i] || '#3B82F6';
                this.ctx.fillRect(x, y, barWidth, barHeight);
                
                if (showValues) {
                    this.ctx.fillStyle = '#1F2937';
                    this.ctx.font = `10px ${this.options.fontFamily}`;
                    this.ctx.textAlign = 'left';
                    this.ctx.fillText(this.formatValue(values[i]), x + barWidth + 5, y + barHeight / 2 + 3);
                }
            });
        } else {
            const barWidth = chartWidth / labels.length - 5;
            
            labels.forEach((label, i) => {
                const barHeight = (values[i] / maxValue) * chartHeight;
                const x = padding.left + i * (barWidth + 5);
                const y = this.canvas.height - padding.bottom - barHeight;
                
                this.ctx.fillStyle = colors[i] || '#3B82F6';
                this.ctx.fillRect(x, y, barWidth, barHeight);
                
                if (showValues) {
                    this.ctx.fillStyle = '#1F2937';
                    this.ctx.font = `10px ${this.options.fontFamily}`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(this.formatValue(values[i]), x + barWidth / 2, y - 5);
                }
            });
        }
    }
    
    // ===== نمودار دایره‌ای =====
    pieChart(data, options = {}) {
        this.clear();
        
        const { labels = [], values = [], colors = [], title = '' } = data;
        const { showPercentage = true, showLegend = true } = options;
        
        if (labels.length === 0 || values.length === 0) {
            this.drawEmptyState();
            return;
        }
        
        const total = values.reduce((a, b) => a + b, 0);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 - (showLegend ? 40 : 0);
        const radius = Math.min(centerX, centerY) - 40;
        
        // عنوان
        if (title) {
            this.ctx.fillStyle = '#1F2937';
            this.ctx.font = `bold 14px ${this.options.fontFamily}`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(title, this.canvas.width / 2, 25);
        }
        
        let startAngle = -Math.PI / 2;
        const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
        
        values.forEach((value, i) => {
            const angle = (value / total) * Math.PI * 2;
            const endAngle = startAngle + angle;
            
            this.ctx.beginPath();
            this.ctx.fillStyle = colors[i] || defaultColors[i % defaultColors.length];
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.fill();
            
            // نمایش درصد
            if (showPercentage && value > 0) {
                const midAngle = startAngle + angle / 2;
                const labelX = centerX + Math.cos(midAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(midAngle) * (radius * 0.7);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = `bold 12px ${this.options.fontFamily}`;
                this.ctx.shadowBlur = 0;
                this.ctx.fillText(`${Math.round((value / total) * 100)}%`, labelX - 10, labelY + 4);
            }
            
            startAngle = endAngle;
        });
        
        // راهنما
        if (showLegend) {
            const legendY = this.canvas.height - 50;
            const itemWidth = 100;
            const startX = (this.canvas.width - (labels.length * itemWidth)) / 2;
            
            labels.forEach((label, i) => {
                const x = startX + i * itemWidth;
                
                this.ctx.fillStyle = colors[i] || defaultColors[i % defaultColors.length];
                this.ctx.fillRect(x, legendY, 15, 15);
                
                this.ctx.fillStyle = '#4B5563';
                this.ctx.font = `10px ${this.options.fontFamily}`;
                this.ctx.textAlign = 'left';
                this.ctx.fillText(label, x + 20, legendY + 12);
            });
        }
    }
    
    // ===== حالت خالی =====
    drawEmptyState() {
        this.ctx.fillStyle = '#9CA3AF';
        this.ctx.font = `14px ${this.options.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📊 داده‌ای برای نمایش وجود ندارد', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    // ===== به‌روزرسانی =====
    update(data, type, options = {}) {
        if (type === 'line') this.lineChart(data, options);
        else if (type === 'bar') this.barChart(data, options);
        else if (type === 'pie') this.pieChart(data, options);
    }
}

// ===== تابع کمکی برای ایجاد نمودار =====
function createChart(canvasId, type, data, options = {}) {
    const chart = new SimpleChart(canvasId, options);
    if (type === 'line') chart.lineChart(data, options);
    else if (type === 'bar') chart.barChart(data, options);
    else if (type === 'pie') chart.pieChart(data, options);
    return chart;
}

// در دسترس قرار دادن
window.SimpleChart = SimpleChart;
window.createChart = createChart;
