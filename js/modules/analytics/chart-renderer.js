 /* ============================================
   CHART-RENDERER.JS - رسم نمودارها
   ============================================ */

const ChartRenderer = {
    // نمودارهای فعال
    activeCharts: {},
    
    // پالت رنگی
    colors: {
        primary: '#3B82F6',
        secondary: '#F59E0B',
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F97316',
        info: '#06B6D4',
        purple: '#8B5CF6',
        pink: '#EC4899',
        indigo: '#6366F1',
        teal: '#14B8A6'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        console.log('📊 ماژول رسم نمودارها راه‌اندازی شد');
    },
    
    // ===== رسم نمودار خطی =====
    renderLineChart: function(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        // تنظیم ابعاد
        canvas.width = canvas.offsetWidth || 600;
        canvas.height = canvas.offsetHeight || 300;
        
        const { labels = [], values = [], color = this.colors.primary, title = '' } = data;
        const { showPoints = true, showGrid = true, smooth = false } = options;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const padding = { top: 40, right: 40, bottom: 60, left: 60 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;
        
        if (labels.length === 0 || values.length === 0) {
            this.drawEmptyState(ctx, canvas.width, canvas.height);
            return null;
        }
        
        const maxValue = Math.max(...values, 1);
        const minValue = Math.min(...values, 0);
        const valueRange = maxValue - minValue;
        
        // محورها
        ctx.beginPath();
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        
        // محور Y
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, canvas.height - padding.bottom);
        // محور X
        ctx.moveTo(padding.left, canvas.height - padding.bottom);
        ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
        ctx.stroke();
        
        // خطوط网格
        if (showGrid) {
            const gridLines = 5;
            ctx.beginPath();
            ctx.strokeStyle = '#F3F4F6';
            ctx.lineWidth = 0.5;
            
            for (let i = 0; i <= gridLines; i++) {
                const y = padding.top + (chartHeight / gridLines) * i;
                ctx.moveTo(padding.left, y);
                ctx.lineTo(canvas.width - padding.right, y);
                ctx.stroke();
            }
        }
        
        // مقادیر محور Y
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px Vazir';
        ctx.textAlign = 'right';
        
        for (let i = 0; i <= 4; i++) {
            const value = minValue + (valueRange / 4) * i;
            const y = padding.top + chartHeight - (chartHeight / 4) * i;
            ctx.fillText(this.formatNumber(value), padding.left - 5, y + 3);
        }
        
        // برچسب‌های محور X
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px Vazir';
        ctx.textAlign = 'center';
        
        const step = chartWidth / (labels.length - 1);
        labels.forEach((label, i) => {
            const x = padding.left + step * i;
            ctx.fillText(label, x, canvas.height - padding.bottom + 15);
        });
        
        // عنوان
        if (title) {
            ctx.fillStyle = '#1F2937';
            ctx.font = 'bold 14px Vazir';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, padding.top - 10);
        }
        
        // رسم خط
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        const points = [];
        values.forEach((value, i) => {
            const x = padding.left + step * i;
            const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
            points.push({ x, y });
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // نقاط
        if (showPoints) {
            points.forEach(point => {
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.fillStyle = 'white';
                ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        const chartId = 'chart_' + Date.now();
        this.activeCharts[chartId] = { canvasId, type: 'line', data, options };
        
        return chartId;
    },
    
    // ===== رسم نمودار میله‌ای =====
    renderBarChart: function(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        canvas.width = canvas.offsetWidth || 600;
        canvas.height = canvas.offsetHeight || 300;
        
        const { labels = [], values = [], colors = [], title = '' } = data;
        const { horizontal = false, showValues = true } = options;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (labels.length === 0 || values.length === 0) {
            this.drawEmptyState(ctx, canvas.width, canvas.height);
            return null;
        }
        
        const padding = { top: 40, right: 40, bottom: 60, left: 60 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;
        
        const maxValue = Math.max(...values, 1);
        
        // عنوان
        if (title) {
            ctx.fillStyle = '#1F2937';
            ctx.font = 'bold 14px Vazir';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, padding.top - 10);
        }
        
        if (horizontal) {
            const barHeight = chartHeight / labels.length - 5;
            
            labels.forEach((label, i) => {
                const barWidth = (values[i] / maxValue) * chartWidth;
                const x = padding.left;
                const y = padding.top + i * (barHeight + 5);
                
                ctx.fillStyle = colors[i] || this.colors.primary;
                ctx.fillRect(x, y, barWidth, barHeight);
                
                ctx.fillStyle = '#1F2937';
                ctx.font = '11px Vazir';
                ctx.textAlign = 'right';
                ctx.fillText(label, x - 5, y + barHeight / 2 + 3);
                
                if (showValues) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '10px Vazir';
                    ctx.textAlign = 'left';
                    ctx.fillText(this.formatNumber(values[i]), x + barWidth + 5, y + barHeight / 2 + 3);
                }
            });
        } else {
            const barWidth = chartWidth / labels.length - 5;
            
            labels.forEach((label, i) => {
                const barHeight = (values[i] / maxValue) * chartHeight;
                const x = padding.left + i * (barWidth + 5);
                const y = canvas.height - padding.bottom - barHeight;
                
                ctx.fillStyle = colors[i] || this.colors.primary;
                ctx.fillRect(x, y, barWidth, barHeight);
                
                ctx.fillStyle = '#6B7280';
                ctx.font = '10px Vazir';
                ctx.textAlign = 'center';
                ctx.fillText(label, x + barWidth / 2, canvas.height - padding.bottom + 15);
                
                if (showValues) {
                    ctx.fillStyle = '#1F2937';
                    ctx.font = '10px Vazir';
                    ctx.fillText(this.formatNumber(values[i]), x + barWidth / 2, y - 5);
                }
            });
        }
        
        const chartId = 'chart_' + Date.now();
        this.activeCharts[chartId] = { canvasId, type: 'bar', data, options };
        
        return chartId;
    },
    
    // ===== رسم نمودار دایره‌ای =====
    renderPieChart: function(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        canvas.width = canvas.offsetWidth || 400;
        canvas.height = canvas.offsetHeight || 400;
        
        const { labels = [], values = [], colors = [], title = '' } = data;
        const { showLegend = true, showPercentage = true } = options;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (labels.length === 0 || values.length === 0) {
            this.drawEmptyState(ctx, canvas.width, canvas.height);
            return null;
        }
        
        const total = values.reduce((a, b) => a + b, 0);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - (showLegend ? 30 : 0);
        const radius = Math.min(centerX, centerY) - 20;
        
        let startAngle = -Math.PI / 2;
        
        values.forEach((value, i) => {
            const angle = (value / total) * Math.PI * 2;
            const endAngle = startAngle + angle;
            
            ctx.beginPath();
            ctx.fillStyle = colors[i] || Object.values(this.colors)[i % Object.values(this.colors).length];
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.fill();
            
            // نمایش درصد
            if (showPercentage && value > 0) {
                const midAngle = startAngle + angle / 2;
                const labelX = centerX + Math.cos(midAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(midAngle) * (radius * 0.7);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 12px Vazir';
                ctx.shadowBlur = 0;
                ctx.fillText(`${Math.round((value / total) * 100)}%`, labelX - 10, labelY + 4);
            }
            
            startAngle = endAngle;
        });
        
        // عنوان
        if (title) {
            ctx.fillStyle = '#1F2937';
            ctx.font = 'bold 14px Vazir';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, 25);
        }
        
        // راهنما
        if (showLegend) {
            const legendY = canvas.height - 60;
            const itemWidth = 120;
            const startX = (canvas.width - (labels.length * itemWidth)) / 2;
            
            labels.forEach((label, i) => {
                const x = startX + i * itemWidth;
                
                ctx.fillStyle = colors[i] || Object.values(this.colors)[i % Object.values(this.colors).length];
                ctx.fillRect(x, legendY, 15, 15);
                
                ctx.fillStyle = '#4B5563';
                ctx.font = '10px Vazir';
                ctx.textAlign = 'left';
                ctx.fillText(label, x + 20, legendY + 12);
            });
        }
        
        const chartId = 'chart_' + Date.now();
        this.activeCharts[chartId] = { canvasId, type: 'pie', data, options };
        
        return chartId;
    },
    
    // ===== رسم نمودار حرارتی =====
    renderHeatmapChart: function(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        canvas.width = canvas.offsetWidth || 800;
        canvas.height = canvas.offsetHeight || 400;
        
        const { matrix = [], xLabels = [], yLabels = [], title = '' } = data;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (matrix.length === 0) {
            this.drawEmptyState(ctx, canvas.width, canvas.height);
            return null;
        }
        
        const padding = { top: 40, right: 40, bottom: 60, left: 60 };
        const cellWidth = (canvas.width - padding.left - padding.right) / (matrix[0]?.length || 1);
        const cellHeight = (canvas.height - padding.top - padding.bottom) / matrix.length;
        
        // عنوان
        if (title) {
            ctx.fillStyle = '#1F2937';
            ctx.font = 'bold 14px Vazir';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, padding.top - 10);
        }
        
        const maxValue = Math.max(...matrix.flat());
        const minValue = Math.min(...matrix.flat());
        
        matrix.forEach((row, i) => {
            row.forEach((value, j) => {
                const x = padding.left + j * cellWidth;
                const y = padding.top + i * cellHeight;
                
                const intensity = (value - minValue) / (maxValue - minValue);
                const color = this.getHeatmapColor(intensity);
                
                ctx.fillStyle = color;
                ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
                
                // نمایش مقدار
                ctx.fillStyle = intensity > 0.5 ? '#FFFFFF' : '#1F2937';
                ctx.font = '10px Vazir';
                ctx.textAlign = 'center';
                ctx.fillText(value, x + cellWidth / 2, y + cellHeight / 2 + 3);
            });
        });
        
        // برچسب‌های X
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px Vazir';
        ctx.textAlign = 'center';
        xLabels.forEach((label, j) => {
            const x = padding.left + j * cellWidth + cellWidth / 2;
            ctx.fillText(label, x, canvas.height - padding.bottom + 15);
        });
        
        // برچسب‌های Y
        ctx.textAlign = 'right';
        yLabels.forEach((label, i) => {
            const y = padding.top + i * cellHeight + cellHeight / 2;
            ctx.fillText(label, padding.left - 10, y + 3);
        });
        
        const chartId = 'chart_' + Date.now();
        this.activeCharts[chartId] = { canvasId, type: 'heatmap', data, options };
        
        return chartId;
    },
    
    // ===== رنگ حرارتی =====
    getHeatmapColor: function(intensity) {
        const r = Math.floor(255 * (1 - intensity));
        const g = Math.floor(255 * (1 - intensity * 0.5));
        const b = Math.floor(255 * (1 - intensity * 0.8));
        return `rgb(${r}, ${g}, ${b})`;
    },
    
    // ===== رسم حالت خالی =====
    drawEmptyState: function(ctx, width, height) {
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '14px Vazir';
        ctx.textAlign = 'center';
        ctx.fillText('📊 داده‌ای برای نمایش وجود ندارد', width / 2, height / 2);
    },
    
    // ===== به‌روزرسانی نمودار =====
    updateChart: function(chartId, newData) {
        const chart = this.activeCharts[chartId];
        if (!chart) return false;
        
        const { canvasId, type, options } = chart;
        const newChartData = { ...chart.data, ...newData };
        
        switch(type) {
            case 'line':
                this.renderLineChart(canvasId, newChartData, options);
                break;
            case 'bar':
                this.renderBarChart(canvasId, newChartData, options);
                break;
            case 'pie':
                this.renderPieChart(canvasId, newChartData, options);
                break;
            case 'heatmap':
                this.renderHeatmapChart(canvasId, newChartData, options);
                break;
        }
        
        this.activeCharts[chartId] = { ...chart, data: newChartData };
        return true;
    },
    
    // ===== حذف نمودار =====
    destroyChart: function(chartId) {
        if (this.activeCharts[chartId]) {
            delete this.activeCharts[chartId];
            return true;
        }
        return false;
    },
    
    // ===== فرمت اعداد =====
    formatNumber: function(num) {
        if (num === undefined || num === null) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ChartRenderer.init();
});

window.ChartRenderer = ChartRenderer;
