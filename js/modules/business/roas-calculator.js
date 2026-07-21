 /* ============================================
   ROAS-CALCULATOR.JS - محاسبه بازگشت سرمایه
   ============================================ */

const ROASCalculator = {
    // کسب‌وکار فعلی
    businessId: null,
    
    // هزینه‌ها
    costs: {
        marketing: 0,
        staff: 0,
        rent: 0,
        other: 0
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        const user = AuthSession.getUser();
        if (user && user.role === 'business') {
            this.businessId = user.id;
            this.loadCosts();
        }
        this.attachEvents();
        console.log('📈 ماژول محاسبه بازگشت سرمایه راه‌اندازی شد');
    },
    
    // ===== بارگذاری هزینه‌ها =====
    loadCosts: function() {
        const saved = localStorage.getItem(`business_costs_${this.businessId}`);
        if (saved) {
            try {
                this.costs = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره هزینه‌ها =====
    saveCosts: function() {
        if (this.businessId) {
            localStorage.setItem(`business_costs_${this.businessId}`, JSON.stringify(this.costs));
        }
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('roas:calculate', (data) => {
            return this.calculateROAS(data);
        });
    },
    
    // ===== محاسبه ROAS =====
    calculateROAS: function(data) {
        const { startDate, endDate, marketingSpend } = data;
        
        // محاسبه درآمد
        const revenue = this.calculateRevenueInRange(startDate, endDate);
        
        // کل هزینه‌ها
        const totalCost = (marketingSpend || this.costs.marketing) + 
                          this.costs.staff + 
                          this.costs.rent + 
                          this.costs.other;
        
        // محاسبه سود
        const profit = revenue - totalCost;
        
        // محاسبه ROAS (بازگشت سرمایه تبلیغاتی)
        const marketingSpendActual = marketingSpend || this.costs.marketing;
        const roas = marketingSpendActual > 0 ? (revenue / marketingSpendActual) * 100 : 0;
        
        // محاسبه ROI (بازگشت سرمایه کلی)
        const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        
        // محاسبه CAC (هزینه جذب مشتری)
        const newCustomers = this.getNewCustomersCount(startDate, endDate);
        const cac = newCustomers > 0 ? marketingSpendActual / newCustomers : 0;
        
        // محاسبه LTV (ارزش مادام‌العمر مشتری)
        const ltv = this.calculateLTV();
        
        return {
            revenue: revenue,
            totalCost: totalCost,
            profit: profit,
            roas: roas,
            roi: roi,
            cac: cac,
            ltv: ltv,
            ltvToCacRatio: cac > 0 ? ltv / cac : 0,
            newCustomers: newCustomers,
            breakEvenPoint: this.calculateBreakEvenPoint(totalCost, revenue),
            recommendation: this.getRecommendation(roas, roi, ltv, cac)
        };
    },
    
    // ===== محاسبه درآمد در بازه زمانی =====
    calculateRevenueInRange: function(startDate, endDate) {
        const bookings = this.getBookingsInRange(startDate, endDate);
        const completedBookings = bookings.filter(b => b.status === 'completed');
        return completedBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    },
    
    // ===== دریافت نوبت‌ها در بازه زمانی =====
    getBookingsInRange: function(startDate, endDate) {
        const allBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const businessBookings = allBookings.filter(b => b.business?.id === this.businessId);
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return businessBookings.filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate >= start && bookingDate <= end;
        });
    },
    
    // ===== تعداد مشتریان جدید =====
    getNewCustomersCount: function(startDate, endDate) {
        const bookings = this.getBookingsInRange(startDate, endDate);
        const uniqueCustomers = new Set();
        bookings.forEach(b => {
            if (b.customer && b.customer.phone) {
                uniqueCustomers.add(b.customer.phone);
            }
        });
        return uniqueCustomers.size;
    },
    
    // ===== محاسبه LTV =====
    calculateLTV: function() {
        const allBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const businessBookings = allBookings.filter(b => b.business?.id === this.businessId);
        
        const customerData = {};
        businessBookings.forEach(b => {
            if (b.customer && b.customer.phone) {
                if (!customerData[b.customer.phone]) {
                    customerData[b.customer.phone] = {
                        totalSpent: 0,
                        bookings: 0
                    };
                }
                customerData[b.customer.phone].totalSpent += b.finalPrice || 0;
                customerData[b.customer.phone].bookings++;
            }
        });
        
        const customers = Object.values(customerData);
        if (customers.length === 0) return 0;
        
        const averageLTV = customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length;
        return averageLTV;
    },
    
    // ===== محاسبه نقطه سر به سر =====
    calculateBreakEvenPoint: function(totalCost, revenue) {
        if (revenue === 0) return null;
        return (totalCost / revenue) * 100;
    },
    
    // ===== دریافت توصیه =====
    getRecommendation: function(roas, roi, ltv, cac) {
        const recommendations = [];
        
        if (roas < 100) {
            recommendations.push('کمپین‌های تبلیغاتی خود را بهینه‌سازی کنید');
        } else if (roas > 300) {
            recommendations.push('بودجه تبلیغاتی خود را افزایش دهید');
        }
        
        if (roi < 0) {
            recommendations.push('هزینه‌های خود را کاهش دهید یا قیمت‌ها را افزایش دهید');
        } else if (roi > 50) {
            recommendations.push('کسب‌وکار شما سودآوری خوبی دارد');
        }
        
        if (ltv < cac * 3) {
            recommendations.push('ارزش مادام‌العمر مشتریان را افزایش دهید (برنامه وفاداری)');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('کسب‌وکار شما در وضعیت مطلوبی قرار دارد');
        }
        
        return recommendations;
    },
    
    // ===== نمایش مودال ROAS =====
    showROASModal: function() {
        const modal = document.createElement('div');
        modal.id = 'roasModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>📈 بازگشت سرمایه (ROAS/ROI)</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="costs-section">
                        <h4>هزینه‌های ماهانه</h4>
                        <div class="costs-form">
                            <div class="form-group">
                                <label>هزینه تبلیغات (تومان)</label>
                                <input type="number" id="marketingCost" class="form-control" value="${this.costs.marketing}">
                            </div>
                            <div class="form-group">
                                <label>هزینه کارکنان (تومان)</label>
                                <input type="number" id="staffCost" class="form-control" value="${this.costs.staff}">
                            </div>
                            <div class="form-group">
                                <label>هزینه اجاره (تومان)</label>
                                <input type="number" id="rentCost" class="form-control" value="${this.costs.rent}">
                            </div>
                            <div class="form-group">
                                <label>سایر هزینه‌ها (تومان)</label>
                                <input type="number" id="otherCost" class="form-control" value="${this.costs.other}">
                            </div>
                            <button class="btn btn-outline btn-small" id="saveCostsBtn">ذخیره هزینه‌ها</button>
                        </div>
                    </div>
                    
                    <div class="roas-filters">
                        <div class="form-group">
                            <label>از تاریخ</label>
                            <input type="date" id="roasStartDate" class="form-control" value="${this.getLastMonthDate()}">
                        </div>
                        <div class="form-group">
                            <label>تا تاریخ</label>
                            <input type="date" id="roasEndDate" class="form-control" value="${this.getTodayDate()}">
                        </div>
                        <div class="form-group">
                            <label>هزینه تبلیغات (اختصاصی)</label>
                            <input type="number" id="roasMarketingSpend" class="form-control" placeholder="اختیاری">
                        </div>
                        <button class="btn btn-primary" id="calculateROASBtn">محاسبه</button>
                    </div>
                    
                    <div id="roasResult" class="roas-result"></div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // ذخیره هزینه‌ها
        document.getElementById('saveCostsBtn')?.addEventListener('click', () => {
            this.costs = {
                marketing: parseInt(document.getElementById('marketingCost')?.value) || 0,
                staff: parseInt(document.getElementById('staffCost')?.value) || 0,
                rent: parseInt(document.getElementById('rentCost')?.value) || 0,
                other: parseInt(document.getElementById('otherCost')?.value) || 0
            };
            this.saveCosts();
            App.showToast('هزینه‌ها ذخیره شد', 'success');
        });
        
        // محاسبه ROAS
        document.getElementById('calculateROASBtn')?.addEventListener('click', () => {
            const startDate = document.getElementById('roasStartDate')?.value;
            const endDate = document.getElementById('roasEndDate')?.value;
            const marketingSpend = parseInt(document.getElementById('roasMarketingSpend')?.value) || null;
            
            if (startDate && endDate) {
                const result = this.calculateROAS({ startDate, endDate, marketingSpend });
                this.displayROASResult(result);
            } else {
                App.showToast('لطفاً بازه زمانی را مشخص کنید', 'error');
            }
        });
    },
    
    // ===== نمایش نتیجه ROAS =====
    displayROASResult: function(result) {
        const resultDiv = document.getElementById('roasResult');
        if (!resultDiv) return;
        
        resultDiv.innerHTML = `
            <div class="roas-stats">
                <div class="stat-card ${result.roas >= 200 ? 'success' : result.roas >= 100 ? 'warning' : 'danger'}">
                    <div class="stat-value">${result.roas.toFixed(1)}%</div>
                    <div class="stat-label">ROAS</div>
                    <small>بازگشت سرمایه تبلیغاتی</small>
                </div>
                <div class="stat-card ${result.roi >= 20 ? 'success' : result.roi >= 0 ? 'warning' : 'danger'}">
                    <div class="stat-value">${result.roi.toFixed(1)}%</div>
                    <div class="stat-label">ROI</div>
                    <small>بازگشت سرمایه کلی</small>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${this.formatPrice(result.revenue)}</div>
                    <div class="stat-label">درآمد</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${this.formatPrice(result.profit)}</div>
                    <div class="stat-label">سود خالص</div>
                </div>
            </div>
            
            <div class="roas-details">
                <div class="detail-row">
                    <span>هزینه جذب مشتری (CAC):</span>
                    <strong>${this.formatPrice(result.cac)}</strong>
                </div>
                <div class="detail-row">
                    <span>ارزش مادام‌العمر (LTV):</span>
                    <strong>${this.formatPrice(result.ltv)}</strong>
                </div>
                <div class="detail-row">
                    <span>نسبت LTV/CAC:</span>
                    <strong>${result.ltvToCacRatio.toFixed(1)}x</strong>
                    <span class="hint">(ایده‌آل: 3x)</span>
                </div>
                <div class="detail-row">
                    <span>تعداد مشتریان جدید:</span>
                    <strong>${result.newCustomers}</strong>
                </div>
                <div class="detail-row">
                    <span>نقطه سر به سر:</span>
                    <strong>${result.breakEvenPoint ? result.breakEvenPoint.toFixed(1) + '%' : '-'}</strong>
                </div>
            </div>
            
            <div class="roas-recommendations">
                <h4>💡 توصیه‌ها</h4>
                <ul>
                    ${result.recommendation.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
        `;
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    },
    
    // ===== توابع کمکی تاریخ =====
    getTodayDate: function() {
        return new Date().toISOString().split('T')[0];
    },
    
    getLastMonthDate: function() {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    }
};

// استایل‌های ROAS
const roasStyles = `
<style>
.costs-section {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
}

.costs-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-top: 10px;
}

.roas-filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 25px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
}

.roas-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.roas-stats .stat-card.success {
    background: linear-gradient(135deg, var(--color-success), #0b5e42);
}

.roas-stats .stat-card.warning {
    background: linear-gradient(135deg, var(--color-warning), #b45309);
}

.roas-stats .stat-card.danger {
    background: linear-gradient(135deg, var(--color-danger), #7f1d1d);
}

.roas-details {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-row .hint {
    font-size: 11px;
    color: var(--text-tertiary);
    margin-right: 10px;
}

.roas-recommendations {
    background: var(--color-primary-soft);
    border-radius: var(--radius-md);
    padding: 15px;
}

.roas-recommendations h4 {
    margin-bottom: 10px;
}

.roas-recommendations ul {
    padding-right: 20px;
}

.roas-recommendations li {
    margin-bottom: 5px;
}
</style>
`;

if (!document.querySelector('#roas-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'roas-styles';
    styleSheet.textContent = roasStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    ROASCalculator.init();
});

window.ROASCalculator = ROASCalculator;
