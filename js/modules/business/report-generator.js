 /* ============================================
   REPORT-GENERATOR.JS - تولید گزارشات
   ============================================ */

const ReportGenerator = {
    // کسب‌وکار فعلی
    businessId: null,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        const user = AuthSession.getUser();
        if (user && user.role === 'business') {
            this.businessId = user.id;
        }
        this.attachEvents();
        console.log('📊 ماژول تولید گزارشات راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('report:generate', (data) => {
            return this.generateReport(data);
        });
    },
    
    // ===== تولید گزارش =====
    generateReport: function(data) {
        const { type, startDate, endDate, format = 'html' } = data;
        
        switch(type) {
            case 'bookings':
                return this.generateBookingsReport(startDate, endDate, format);
            case 'revenue':
                return this.generateRevenueReport(startDate, endDate, format);
            case 'customers':
                return this.generateCustomersReport(startDate, endDate, format);
            case 'services':
                return this.generateServicesReport(startDate, endDate, format);
            case 'staff':
                return this.generateStaffReport(startDate, endDate, format);
            default:
                return null;
        }
    },
    
    // ===== گزارش نوبت‌ها =====
    generateBookingsReport: function(startDate, endDate, format) {
        const bookings = this.getBookingsInRange(startDate, endDate);
        
        const report = {
            title: 'گزارش نوبت‌ها',
            period: `${this.formatDate(startDate)} تا ${this.formatDate(endDate)}`,
            generatedAt: new Date().toLocaleDateString('fa-IR'),
            data: {
                total: bookings.length,
                completed: bookings.filter(b => b.status === 'completed').length,
                cancelled: bookings.filter(b => b.status === 'cancelled').length,
                pending: bookings.filter(b => b.status === 'pending').length,
                occupancyRate: bookings.length > 0 ? (bookings.length / 500) * 100 : 0,
                bookings: bookings
            }
        };
        
        if (format === 'html') {
            return this.renderBookingsReportHTML(report);
        } else if (format === 'csv') {
            return this.exportToCSV(bookings, 'bookings_report.csv');
        }
        
        return report;
    },
    
    // ===== رندر گزارش نوبت‌ها به HTML =====
    renderBookingsReportHTML: function(report) {
        return `
            <div class="report-container">
                <div class="report-header">
                    <h3>${report.title}</h3>
                    <p>دوره: ${report.period}</p>
                    <p>تاریخ تولید: ${report.generatedAt}</p>
                </div>
                <div class="report-stats">
                    <div class="stat-card">
                        <div class="stat-value">${report.data.total}</div>
                        <div class="stat-label">کل نوبت‌ها</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${report.data.completed}</div>
                        <div class="stat-label">انجام شده</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${report.data.cancelled}</div>
                        <div class="stat-label">لغو شده</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${report.data.pending}</div>
                        <div class="stat-label">در انتظار</div>
                    </div>
                </div>
                <div class="report-table">
                    <table class="data-table">
                        <thead>
                            <tr><th>کد نوبت</th><th>خدمت</th><th>تاریخ</th><th>ساعت</th><th>مشتری</th><th>وضعیت</th></tr>
                        </thead>
                        <tbody>
                            ${report.data.bookings.map(b => `
                                <tr>
                                    <td>${b.id}</td>
                                    <td>${b.service?.name || '-'}</td>
                                    <td>${this.formatDate(b.date)}</td>
                                    <td>${b.time}</td>
                                    <td>${b.customer?.name || '-'}</td>
                                    <td>${this.getStatusText(b.status)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    // ===== گزارش درآمد =====
    generateRevenueReport: function(startDate, endDate, format) {
        const bookings = this.getBookingsInRange(startDate, endDate);
        const completedBookings = bookings.filter(b => b.status === 'completed');
        
        const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
        const totalDiscount = completedBookings.reduce((sum, b) => sum + (b.discount || 0), 0);
        
        // درآمد روزانه
        const dailyRevenue = {};
        completedBookings.forEach(b => {
            const date = b.date;
            if (!dailyRevenue[date]) dailyRevenue[date] = 0;
            dailyRevenue[date] += b.finalPrice || 0;
        });
        
        const report = {
            title: 'گزارش درآمد',
            period: `${this.formatDate(startDate)} تا ${this.formatDate(endDate)}`,
            generatedAt: new Date().toLocaleDateString('fa-IR'),
            data: {
                totalRevenue: totalRevenue,
                totalDiscount: totalDiscount,
                averagePerBooking: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0,
                dailyRevenue: dailyRevenue,
                bookingCount: completedBookings.length
            }
        };
        
        if (format === 'html') {
            return this.renderRevenueReportHTML(report);
        } else if (format === 'csv') {
            return this.exportRevenueToCSV(report);
        }
        
        return report;
    },
    
    // ===== رندر گزارش درآمد به HTML =====
    renderRevenueReportHTML: function(report) {
        return `
            <div class="report-container">
                <div class="report-header">
                    <h3>${report.title}</h3>
                    <p>دوره: ${report.period}</p>
                    <p>تاریخ تولید: ${report.generatedAt}</p>
                </div>
                <div class="report-stats">
                    <div class="stat-card revenue">
                        <div class="stat-value">${this.formatPrice(report.data.totalRevenue)}</div>
                        <div class="stat-label">کل درآمد</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.formatPrice(report.data.totalDiscount)}</div>
                        <div class="stat-label">کل تخفیف</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.formatPrice(report.data.averagePerBooking)}</div>
                        <div class="stat-label">میانگین هر نوبت</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${report.data.bookingCount}</div>
                        <div class="stat-label">تعداد نوبت‌ها</div>
                    </div>
                </div>
                <div class="report-table">
                    <h4>درآمد روزانه</h4>
                    <table class="data-table">
                        <thead><tr><th>تاریخ</th><th>درآمد</th></tr></thead>
                        <tbody>
                            ${Object.entries(report.data.dailyRevenue).map(([date, revenue]) => `
                                <tr><td>${this.formatDate(date)}</td><td>${this.formatPrice(revenue)}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    // ===== گزارش مشتریان =====
    generateCustomersReport: function(startDate, endDate, format) {
        const bookings = this.getBookingsInRange(startDate, endDate);
        
        // مشتریان منحصر به فرد
        const customers = {};
        bookings.forEach(b => {
            if (b.customer && b.customer.phone) {
                if (!customers[b.customer.phone]) {
                    customers[b.customer.phone] = {
                        name: b.customer.name,
                        phone: b.customer.phone,
                        bookings: 0,
                        totalSpent: 0
                    };
                }
                customers[b.customer.phone].bookings++;
                customers[b.customer.phone].totalSpent += b.finalPrice || 0;
            }
        });
        
        const report = {
            title: 'گزارش مشتریان',
            period: `${this.formatDate(startDate)} تا ${this.formatDate(endDate)}`,
            generatedAt: new Date().toLocaleDateString('fa-IR'),
            data: {
                totalCustomers: Object.keys(customers).length,
                totalBookings: bookings.length,
                averagePerCustomer: Object.keys(customers).length > 0 ? bookings.length / Object.keys(customers).length : 0,
                customers: Object.values(customers).sort((a, b) => b.bookings - a.bookings)
            }
        };
        
        if (format === 'html') {
            return this.renderCustomersReportHTML(report);
        }
        
        return report;
    },
    
    // ===== رندر گزارش مشتریان به HTML =====
    renderCustomersReportHTML: function(report) {
        return `
            <div class="report-container">
                <div class="report-header">
                    <h3>${report.title}</h3>
                    <p>دوره: ${report.period}</p>
                    <p>تاریخ تولید: ${report.generatedAt}</p>
                </div>
                <div class="report-stats">
                    <div class="stat-card">
                        <div class="stat-value">${report.data.totalCustomers}</div>
                        <div class="stat-label">کل مشتریان</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${report.data.totalBookings}</div>
                        <div class="stat-label">کل نوبت‌ها</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${report.data.averagePerCustomer.toFixed(1)}</div>
                        <div class="stat-label">میانگین نوبت هر مشتری</div>
                    </div>
                </div>
                <div class="report-table">
                    <h4>لیست مشتریان</h4>
                    <table class="data-table">
                        <thead><tr><th>نام</th><th>شماره تماس</th><th>تعداد نوبت</th><th>مبلغ کل</th></tr></thead>
                        <tbody>
                            ${report.data.customers.map(c => `
                                <tr>
                                    <td>${c.name}</td>
                                    <td>${c.phone}</td>
                                    <td>${c.bookings}</td>
                                    <td>${this.formatPrice(c.totalSpent)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    // ===== گزارش خدمات =====
    generateServicesReport: function(startDate, endDate, format) {
        const bookings = this.getBookingsInRange(startDate, endDate);
        
        const services = {};
        bookings.forEach(b => {
            if (b.service && b.service.name) {
                if (!services[b.service.name]) {
                    services[b.service.name] = {
                        name: b.service.name,
                        count: 0,
                        revenue: 0
                    };
                }
                services[b.service.name].count++;
                services[b.service.name].revenue += b.finalPrice || 0;
            }
        });
        
        const report = {
            title: 'گزارش خدمات',
            period: `${this.formatDate(startDate)} تا ${this.formatDate(endDate)}`,
            generatedAt: new Date().toLocaleDateString('fa-IR'),
            data: {
                totalServices: Object.keys(services).length,
                totalBookings: bookings.length,
                services: Object.values(services).sort((a, b) => b.count - a.count)
            }
        };
        
        if (format === 'html') {
            return this.renderServicesReportHTML(report);
        }
        
        return report;
    },
    
    // ===== رندر گزارش خدمات به HTML =====
    renderServicesReportHTML: function(report) {
        return `
            <div class="report-container">
                <div class="report-header">
                    <h3>${report.title}</h3>
                    <p>دوره: ${report.period}</p>
                    <p>تاریخ تولید: ${report.generatedAt}</p>
                </div>
                <div class="report-table">
                    <table class="data-table">
                        <thead><tr><th>خدمت</th><th>تعداد</th><th>درآمد</th><th>درصد</th></tr></thead>
                        <tbody>
                            ${report.data.services.map(s => `
                                <tr>
                                    <td>${s.name}</td>
                                    <td>${s.count}</td>
                                    <td>${this.formatPrice(s.revenue)}</td>
                                    <td>${((s.count / report.data.totalBookings) * 100).toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    // ===== گزارش کارکنان =====
    generateStaffReport: function(startDate, endDate, format) {
        const bookings = this.getBookingsInRange(startDate, endDate);
        const staffList = StaffManagement?.getActiveStaff() || [];
        
        const staffStats = {};
        staffList.forEach(staff => {
            staffStats[staff.id] = {
                name: staff.name,
                role: staff.role,
                bookings: 0,
                revenue: 0
            };
        });
        
        bookings.forEach(b => {
            if (b.staffId && staffStats[b.staffId]) {
                staffStats[b.staffId].bookings++;
                staffStats[b.staffId].revenue += b.finalPrice || 0;
            }
        });
        
        const report = {
            title: 'گزارش عملکرد کارکنان',
            period: `${this.formatDate(startDate)} تا ${this.formatDate(endDate)}`,
            generatedAt: new Date().toLocaleDateString('fa-IR'),
            data: {
                staffStats: Object.values(staffStats)
            }
        };
        
        if (format === 'html') {
            return this.renderStaffReportHTML(report);
        }
        
        return report;
    },
    
    // ===== رندر گزارش کارکنان به HTML =====
    renderStaffReportHTML: function(report) {
        return `
            <div class="report-container">
                <div class="report-header">
                    <h3>${report.title}</h3>
                    <p>دوره: ${report.period}</p>
                    <p>تاریخ تولید: ${report.generatedAt}</p>
                </div>
                <div class="report-table">
                    <table class="data-table">
                        <thead><tr><th>نام</th><th>نقش</th><th>تعداد نوبت</th><th>درآمد</th></tr></thead>
                        <tbody>
                            ${report.data.staffStats.map(s => `
                                <tr>
                                    <td>${s.name}</td>
                                    <td>${s.role}</td>
                                    <td>${s.bookings}</td>
                                    <td>${this.formatPrice(s.revenue)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
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
    
    // ===== خروجی CSV =====
    exportToCSV: function(data, filename) {
        if (!data || data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        App.showToast('گزارش با موفقیت دانلود شد', 'success');
    },
    
    // ===== خروجی اکسل (CSV) =====
    exportRevenueToCSV: function(report) {
        const data = Object.entries(report.data.dailyRevenue).map(([date, revenue]) => ({
            تاریخ: this.formatDate(date),
            درآمد: revenue
        }));
        this.exportToCSV(data, 'revenue_report.csv');
    },
    
    // ===== نمایش مودال گزارشات =====
    showReportModal: function() {
        const modal = document.createElement('div');
        modal.id = 'reportModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>📊 گزارشات</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="report-filters">
                        <div class="form-group">
                            <label>نوع گزارش</label>
                            <select id="reportType" class="form-control">
                                <option value="bookings">گزارش نوبت‌ها</option>
                                <option value="revenue">گزارش درآمد</option>
                                <option value="customers">گزارش مشتریان</option>
                                <option value="services">گزارش خدمات</option>
                                <option value="staff">گزارش کارکنان</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>از تاریخ</label>
                            <input type="date" id="startDate" class="form-control" value="${this.getLastMonthDate()}">
                        </div>
                        <div class="form-group">
                            <label>تا تاریخ</label>
                            <input type="date" id="endDate" class="form-control" value="${this.getTodayDate()}">
                        </div>
                        <div class="form-group">
                            <label>فرمت خروجی</label>
                            <select id="outputFormat" class="form-control">
                                <option value="html">نمایش در صفحه</option>
                                <option value="csv">دانلود CSV</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="generateReportBtn">تولید گزارش</button>
                    </div>
                    
                    <div id="reportResult" class="report-result"></div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            const type = document.getElementById('reportType')?.value;
            const startDate = document.getElementById('startDate')?.value;
            const endDate = document.getElementById('endDate')?.value;
            const format = document.getElementById('outputFormat')?.value;
            
            if (startDate && endDate) {
                const report = this.generateReport({ type, startDate, endDate, format });
                if (format === 'html') {
                    const resultDiv = document.getElementById('reportResult');
                    if (resultDiv) {
                        resultDiv.innerHTML = report;
                    }
                }
            } else {
                App.showToast('لطفاً بازه زمانی را مشخص کنید', 'error');
            }
        });
    },
    
    // ===== توابع کمکی =====
    getTodayDate: function() {
        return new Date().toISOString().split('T')[0];
    },
    
    getLastMonthDate: function() {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    },
    
    formatDate: function(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fa-IR');
    },
    
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    },
    
    getStatusText: function(status) {
        const statusMap = {
            pending: 'در انتظار',
            confirmed: 'تأیید شده',
            completed: 'انجام شده',
            cancelled: 'لغو شده'
        };
        return statusMap[status] || status;
    }
};

// استایل‌های گزارشات
const reportStyles = `
<style>
.report-filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 25px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
}

.report-result {
    margin-top: 20px;
    max-height: 500px;
    overflow-y: auto;
}

.report-container {
    padding: 15px;
}

.report-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--border-color);
}

.report-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 25px;
}

.report-stats .stat-card.revenue {
    background: linear-gradient(135deg, var(--color-success), var(--color-primary));
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 10px;
    text-align: right;
    border-bottom: 1px solid var(--border-color);
}

.data-table th {
    background: var(--bg-secondary);
    font-weight: bold;
}
</style>
`;

if (!document.querySelector('#report-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'report-styles';
    styleSheet.textContent = reportStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    ReportGenerator.init();
});

window.ReportGenerator = ReportGenerator;
