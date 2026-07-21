 /* ============================================
   BUSINESS-DASHBOARD.JS - داشبورد مدیریت کسب‌وکار
   ============================================ */

const BusinessDashboard = {
    // کسب‌وکار فعلی
    currentBusiness: null,
    
    // آمار داشبورد
    stats: {
        totalBookings: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        averageRating: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        occupancyRate: 0
    },
    
    // نمودارها
    charts: {},
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadBusinessData();
        this.attachEvents();
        this.initCharts();
        console.log('📊 داشبورد کسب‌وکار راه‌اندازی شد');
    },
    
    // ===== بارگذاری داده‌های کسب‌وکار =====
    loadBusinessData: function() {
        const user = AuthSession.getUser();
        if (!user || user.role !== 'business') return;
        
        // بارگذاری اطلاعات کسب‌وکار
        const saved = localStorage.getItem(`business_${user.id}`);
        if (saved) {
            try {
                this.currentBusiness = JSON.parse(saved);
            } catch(e) {}
        }
        
        // داده‌های نمونه برای کسب‌وکار جدید
        if (!this.currentBusiness) {
            this.currentBusiness = {
                id: user.id,
                name: 'کسب‌وکار من',
                ownerName: user.name,
                phone: user.phone,
                email: user.email || '',
                address: 'تهران، خیابان اصلی',
                logo: null,
                coverImage: null,
                description: 'توضیحات کسب‌وکار',
                categories: ['خدمات'],
                rating: 0,
                totalReviews: 0,
                createdAt: new Date().toISOString(),
                subscription: {
                    plan: 'starter',
                    status: 'active',
                    expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString()
                }
            };
            this.saveBusinessData();
        }
        
        this.loadStats();
    },
    
    // ===== ذخیره داده‌های کسب‌وکار =====
    saveBusinessData: function() {
        if (this.currentBusiness) {
            localStorage.setItem(`business_${this.currentBusiness.id}`, JSON.stringify(this.currentBusiness));
        }
    },
    
    // ===== بارگذاری آمار =====
    loadStats: function() {
        // بارگذاری نوبت‌های کسب‌وکار
        const bookings = JSON.parse(localStorage.getItem('business_bookings') || '[]');
        const businessBookings = bookings.filter(b => b.businessId === this.currentBusiness?.id);
        
        this.stats.totalBookings = businessBookings.length;
        this.stats.pendingBookings = businessBookings.filter(b => b.status === 'pending').length;
        this.stats.cancelledBookings = businessBookings.filter(b => b.status === 'cancelled').length;
        this.stats.completedBookings = businessBookings.filter(b => b.status === 'completed').length;
        
        // محاسبه درآمد
        this.stats.totalRevenue = businessBookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.finalPrice || 0), 0);
        
        // تعداد مشتریان منحصر به فرد
        const uniqueCustomers = new Set(businessBookings.map(b => b.customerId));
        this.stats.totalCustomers = uniqueCustomers.size;
        
        // نرخ اشغال (فرضی)
        this.stats.occupancyRate = Math.min(100, (this.stats.totalBookings / 500) * 100);
        
        // میانگین امتیاز
        const reviews = JSON.parse(localStorage.getItem('business_reviews') || '[]');
        const businessReviews = reviews.filter(r => r.businessId === this.currentBusiness?.id);
        if (businessReviews.length > 0) {
            this.stats.averageRating = businessReviews.reduce((sum, r) => sum + r.rating, 0) / businessReviews.length;
        }
        
        this.updateDashboardUI();
    },
    
    // ===== به‌روزرسانی UI داشبورد =====
    updateDashboardUI: function() {
        // به‌روزرسانی المان‌های آمار
        const elements = {
            totalBookings: document.getElementById('dashboardTotalBookings'),
            totalRevenue: document.getElementById('dashboardTotalRevenue'),
            totalCustomers: document.getElementById('dashboardTotalCustomers'),
            averageRating: document.getElementById('dashboardAverageRating'),
            pendingBookings: document.getElementById('dashboardPendingBookings'),
            occupancyRate: document.getElementById('dashboardOccupancyRate')
        };
        
        if (elements.totalBookings) elements.totalBookings.textContent = this.stats.totalBookings;
        if (elements.totalRevenue) elements.totalRevenue.textContent = this.formatPrice(this.stats.totalRevenue);
        if (elements.totalCustomers) elements.totalCustomers.textContent = this.stats.totalCustomers;
        if (elements.averageRating) elements.averageRating.textContent = this.stats.averageRating.toFixed(1);
        if (elements.pendingBookings) elements.pendingBookings.textContent = this.stats.pendingBookings;
        if (elements.occupancyRate) elements.occupancyRate.textContent = Math.round(this.stats.occupancyRate) + '%';
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('business:data-updated', () => {
            this.loadBusinessData();
            this.loadStats();
        });
        
        App.on(SystemEvents.BOOKING_CREATED, (booking) => {
            if (booking.businessId === this.currentBusiness?.id) {
                this.loadStats();
            }
        });
    },
    
    // ===== راه‌اندازی نمودارها =====
    initCharts: function() {
        // در حالت واقعی، اینجا کتابخانه نمودار راه‌اندازی می‌شود
        this.renderWeeklyChart();
        this.renderCategoryChart();
    },
    
    // ===== نمودار هفتگی =====
    renderWeeklyChart: function() {
        const canvas = document.getElementById('weeklyChart');
        if (!canvas) return;
        
        // داده‌های نمونه
        const data = [12, 19, 15, 17, 14, 22, 18];
        const labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
        
        // شبیه‌سازی نمودار ساده
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = canvas.offsetWidth;
            canvas.height = 200;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width - 40) / data.length - 5;
            const maxValue = Math.max(...data);
            
            data.forEach((value, index) => {
                const height = (value / maxValue) * (canvas.height - 60);
                const x = 20 + index * (barWidth + 5);
                const y = canvas.height - 20 - height;
                
                ctx.fillStyle = '#3B82F6';
                ctx.fillRect(x, y, barWidth, height);
                
                ctx.fillStyle = '#666';
                ctx.font = '10px Vazir';
                ctx.fillText(labels[index], x, canvas.height - 5);
                ctx.fillText(value, x, y - 5);
            });
        }
    },
    
    // ===== نمودار دسته‌بندی =====
    renderCategoryChart: function() {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = canvas.offsetWidth;
            canvas.height = 200;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // شبیه‌سازی نمودار دایره‌ای ساده
            ctx.fillStyle = '#3B82F6';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#F59E0B';
            ctx.fillRect(0, 0, canvas.width * 0.4, canvas.height);
            ctx.fillStyle = '#10B981';
            ctx.fillRect(0, 0, canvas.width * 0.25, canvas.height);
            
            ctx.fillStyle = 'white';
            ctx.font = '12px Vazir';
            ctx.fillText('خدمات آرایشی', 10, 30);
            ctx.fillText('خدمات پزشکی', 10, 60);
            ctx.fillText('سایر', 10, 90);
        }
    },
    
    // ===== نمایش مودال داشبورد =====
    showDashboardModal: function() {
        const modal = document.createElement('div');
        modal.id = 'businessDashboardModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>📊 داشبورد مدیریت | ${this.currentBusiness?.name || 'کسب‌وکار'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <div class="stat-value" id="dashboardTotalBookings">${this.stats.totalBookings}</div>
                            <div class="stat-label">کل نوبت‌ها</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="dashboardTotalRevenue">${this.formatPrice(this.stats.totalRevenue)}</div>
                            <div class="stat-label">درآمد کل</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="dashboardTotalCustomers">${this.stats.totalCustomers}</div>
                            <div class="stat-label">مشتریان</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="dashboardAverageRating">${this.stats.averageRating.toFixed(1)}</div>
                            <div class="stat-label">میانگین امتیاز</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="dashboardPendingBookings">${this.stats.pendingBookings}</div>
                            <div class="stat-label">نوبت‌های در انتظار</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="dashboardOccupancyRate">${Math.round(this.stats.occupancyRate)}%</div>
                            <div class="stat-label">نرخ اشغال</div>
                        </div>
                    </div>
                    
                    <div class="dashboard-charts">
                        <div class="chart-container">
                            <h4>نوبت‌های هفتگی</h4>
                            <canvas id="weeklyChart" width="400" height="200"></canvas>
                        </div>
                        <div class="chart-container">
                            <h4>دسته‌بندی خدمات</h4>
                            <canvas id="categoryChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                    
                    <div class="dashboard-actions">
                        <button class="btn btn-outline" id="manageStaffBtn">👥 مدیریت کارکنان</button>
                        <button class="btn btn-outline" id="manageBranchesBtn">🏢 مدیریت شعبات</button>
                        <button class="btn btn-outline" id="manageServicesBtn">🔧 مدیریت خدمات</button>
                        <button class="btn btn-outline" id="manageScheduleBtn">📅 مدیریت زمانبندی</button>
                    </div>
                    
                    <div class="dashboard-subscription">
                        <h4>طرح اشتراکی</h4>
                        <div class="subscription-info">
                            <span>طرح فعلی: <strong>${this.currentBusiness?.subscription?.plan || 'starter'}</strong></span>
                            <span>وضعیت: <strong class="${this.currentBusiness?.subscription?.status === 'active' ? 'text-success' : 'text-danger'}">${this.currentBusiness?.subscription?.status === 'active' ? 'فعال' : 'غیرفعال'}</strong></span>
                            <span>اعتبار تا: ${new Date(this.currentBusiness?.subscription?.expiresAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <button class="btn btn-primary btn-small" id="upgradePlanBtn">ارتقاء طرح</button>
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
            this.renderCategoryChart();
        }, 100);
        
        // دکمه‌های مدیریت
        document.getElementById('manageStaffBtn')?.addEventListener('click', () => {
            if (window.StaffManagement) {
                modal.remove();
                window.StaffManagement.showStaffModal();
            }
        });
        
        document.getElementById('manageBranchesBtn')?.addEventListener('click', () => {
            if (window.BranchManagement) {
                modal.remove();
                window.BranchManagement.showBranchModal();
            }
        });
        
        document.getElementById('manageServicesBtn')?.addEventListener('click', () => {
            if (window.ServiceManagement) {
                modal.remove();
                window.ServiceManagement.showServiceModal();
            }
        });
        
        document.getElementById('upgradePlanBtn')?.addEventListener('click', () => {
            this.showUpgradePlanModal();
        });
    },
    
    // ===== نمایش مودال ارتقاء طرح =====
    showUpgradePlanModal: function() {
        const plans = [
            { id: 'starter', name: 'آغازگر', price: 299000, bookings: 500, staff: 3, branches: 2 },
            { id: 'professional', name: 'حرفه‌ای', price: 699000, bookings: 2000, staff: 10, branches: 5 },
            { id: 'business', name: 'بیزینس', price: 1490000, bookings: 5000, staff: 25, branches: 15 }
        ];
        
        const modal = document.createElement('div');
        modal.id = 'upgradePlanModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⭐ ارتقاء طرح اشتراکی</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="plans-list">
                        ${plans.map(plan => `
                            <div class="plan-option ${this.currentBusiness?.subscription?.plan === plan.id ? 'current' : ''}" data-plan="${plan.id}">
                                <div class="plan-name">${plan.name}</div>
                                <div class="plan-price">${this.formatPrice(plan.price)}<span>/ماه</span></div>
                                <div class="plan-features">
                                    <div>📅 ${plan.bookings} نوبت در ماه</div>
                                    <div>👥 ${plan.staff} کارمند</div>
                                    <div>🏢 ${plan.branches} شعبه</div>
                                </div>
                                ${this.currentBusiness?.subscription?.plan === plan.id ? 
                                    '<div class="current-badge">طرح فعلی</div>' : 
                                    '<button class="btn btn-outline btn-small select-plan-btn">انتخاب</button>'}
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.querySelectorAll('.select-plan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planDiv = e.target.closest('.plan-option');
                const planId = planDiv?.dataset.plan;
                if (planId) {
                    this.upgradePlan(planId);
                    modal.remove();
                }
            });
        });
    },
    
    // ===== ارتقاء طرح =====
    upgradePlan: function(planId) {
        if (this.currentBusiness) {
            this.currentBusiness.subscription.plan = planId;
            this.currentBusiness.subscription.expiresAt = new Date(Date.now() + 30*24*60*60*1000).toISOString();
            this.saveBusinessData();
            App.showToast(`طرح شما به ${planId} ارتقاء یافت`, 'success');
            App.emit('business:plan-upgraded', { businessId: this.currentBusiness.id, plan: planId });
        }
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

// استایل‌های داشبورد
const dashboardStyles = `
<style>
.dashboard-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-bottom: 25px;
}

.dashboard-stats .stat-card {
    text-align: center;
    padding: 15px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: var(--radius-lg);
    color: white;
}

.dashboard-stats .stat-value {
    font-size: 20px;
    font-weight: bold;
}

.dashboard-stats .stat-label {
    font-size: 12px;
    opacity: 0.9;
    margin-top: 5px;
}

.dashboard-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 25px;
}

.chart-container {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    text-align: center;
}

.chart-container h4 {
    margin-bottom: 10px;
}

.chart-container canvas {
    width: 100%;
    height: auto;
    background: white;
    border-radius: var(--radius-sm);
}

.dashboard-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 20px;
}

.dashboard-subscription {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
}

.subscription-info {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    flex-wrap: wrap;
    gap: 10px;
}

.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }

.plans-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
}

.plan-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    flex-wrap: wrap;
    gap: 15px;
}

.plan-option.current {
    border-color: var(--color-success);
    background: var(--color-success-soft);
}

.plan-name {
    font-weight: bold;
    font-size: 16px;
}

.plan-price {
    font-size: 18px;
    font-weight: bold;
    color: var(--color-primary);
}

.plan-price span {
    font-size: 12px;
    font-weight: normal;
    color: var(--text-tertiary);
}

.plan-features {
    display: flex;
    gap: 15px;
    font-size: 12px;
}

.current-badge {
    background: var(--color-success);
    color: white;
    padding: 5px 10px;
    border-radius: var(--radius-full);
    font-size: 12px;
}

@media (max-width: 768px) {
    .dashboard-stats {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .dashboard-charts {
        grid-template-columns: 1fr;
    }
    
    .dashboard-actions {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
`;

if (!document.querySelector('#dashboard-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dashboard-styles';
    styleSheet.textContent = dashboardStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    BusinessDashboard.init();
});

window.BusinessDashboard = BusinessDashboard;
