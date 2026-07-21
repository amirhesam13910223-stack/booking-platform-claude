 /* ============================================
   EXPORT-REPORTS.JS - خروجی گزارشات
   ============================================ */

const ExportReports = {
    // فرمت‌های پشتیبانی شده
    formats: ['csv', 'json', 'pdf', 'excel'],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('📎 ماژول خروجی گزارشات راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('export:report', (data) => {
            return this.exportReport(data);
        });
    },
    
    // ===== خروجی گزارش =====
    exportReport: function(data) {
        const { type, format = 'csv', filename, filters = {} } = data;
        
        let reportData = [];
        let headers = [];
        
        switch(type) {
            case 'bookings':
                reportData = this.getBookingsReportData(filters);
                headers = ['کد نوبت', 'کسب‌وکار', 'خدمت', 'تاریخ', 'ساعت', 'مشتری', 'مبلغ', 'وضعیت'];
                break;
            case 'revenue':
                reportData = this.getRevenueReportData(filters);
                headers = ['تاریخ', 'درآمد روزانه', 'درآمد هفتگی', 'درآمد ماهانه', 'کارمزد'];
                break;
            case 'users':
                reportData = this.getUsersReportData(filters);
                headers = ['نام', 'شماره تماس', 'ایمیل', 'تاریخ عضویت', 'تعداد نوبت', 'کل هزینه', 'وضعیت'];
                break;
            case 'businesses':
                reportData = this.getBusinessesReportData(filters);
                headers = ['نام کسب‌وکار', 'مالک', 'شماره تماس', 'آدرس', 'تاریخ ثبت', 'تعداد نوبت', 'وضعیت'];
                break;
            case 'discounts':
                reportData = this.getDiscountsReportData(filters);
                headers = ['کد تخفیف', 'نام', 'نوع', 'مقدار', 'تاریخ شروع', 'تاریخ پایان', 'تعداد استفاده'];
                break;
            default:
                return null;
        }
        
        const finalFilename = filename || `${type}_report_${new Date().toISOString().split('T')[0]}`;
        
        switch(format) {
            case 'csv':
                return this.exportToCSV(reportData, headers, finalFilename);
            case 'json':
                return this.exportToJSON(reportData, finalFilename);
            case 'excel':
                return this.exportToExcel(reportData, headers, finalFilename);
            case 'pdf':
                return this.exportToPDF(reportData, headers, finalFilename, type);
            default:
                return this.exportToCSV(reportData, headers, finalFilename);
        }
    },
    
    // ===== دریافت داده‌های نوبت‌ها =====
    getBookingsReportData: function(filters) {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        let filtered = bookings;
        
        if (filters.startDate) {
            filtered = filtered.filter(b => b.date >= filters.startDate);
        }
        if (filters.endDate) {
            filtered = filtered.filter(b => b.date <= filters.endDate);
        }
        if (filters.status) {
            filtered = filtered.filter(b => b.status === filters.status);
        }
        if (filters.businessId) {
            filtered = filtered.filter(b => b.business?.id === filters.businessId);
        }
        
        return filtered.map(b => ({
            id: b.id,
            business: b.business?.name || '-',
            service: b.service?.name || '-',
            date: b.date,
            time: b.time,
            customer: b.customer?.name || '-',
            amount: b.finalPrice || 0,
            status: this.getStatusText(b.status)
        }));
    },
    
    // ===== دریافت داده‌های درآمد =====
    getRevenueReportData: function(filters) {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const completed = bookings.filter(b => b.status === 'completed');
        
        // گروه‌بندی روزانه
        const dailyMap = new Map();
        completed.forEach(b => {
            const date = b.date;
            if (!dailyMap.has(date)) dailyMap.set(date, 0);
            dailyMap.set(date, dailyMap.get(date) + (b.finalPrice || 0));
        });
        
        return Array.from(dailyMap.entries())
            .map(([date, amount]) => ({
                date: date,
                daily: amount,
                weekly: 0,
                monthly: 0,
                commission: amount * 0.03
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    },
    
    // ===== دریافت داده‌های کاربران =====
    getUsersReportData: function(filters) {
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        
        return users.map(u => {
            const userBookings = bookings.filter(b => b.customer?.phone === u.phone);
            const totalSpent = userBookings
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (b.finalPrice || 0), 0);
            
            return {
                name: u.name,
                phone: u.phone,
                email: u.email || '-',
                createdAt: u.createdAt?.split('T')[0] || '-',
                bookings: userBookings.length,
                totalSpent: totalSpent,
                status: u.status || 'active'
            };
        });
    },
    
    // ===== دریافت داده‌های کسب‌وکارها =====
    getBusinessesReportData: function(filters) {
        const businesses = JSON.parse(localStorage.getItem('businesses_list') || '[]');
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        
        return businesses.map(b => {
            const businessBookings = bookings.filter(bk => bk.business?.id === b.id);
            return {
                name: b.name,
                owner: b.ownerName,
                phone: b.phone,
                address: b.address,
                createdAt: b.submittedAt?.split('T')[0] || '-',
                bookings: businessBookings.length,
                status: b.status || 'pending'
            };
        });
    },
    
    // ===== دریافت داده‌های تخفیف‌ها =====
    getDiscountsReportData: function(filters) {
        const discounts = window.CouponSystem?.coupons || [];
        
        return discounts.map(d => ({
            code: d.code,
            name: d.name,
            type: d.type === 'percentage' ? 'درصدی' : 'ثابت',
            value: d.type === 'percentage' ? `${d.value}%` : `${d.value.toLocaleString('fa-IR')} تومان`,
            validFrom: d.validFrom?.split('T')[0] || '-',
            validTo: d.validTo?.split('T')[0] || '-',
            usageCount: d.usageCount || 0
        }));
    },
    
    // ===== خروجی CSV =====
    exportToCSV: function(data, headers, filename) {
        if (!data || data.length === 0) {
            App.showToast('داده‌ای برای خروجی وجود ندارد', 'warning');
            return false;
        }
        
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[this.getKeyFromHeader(header)] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, `${filename}.csv`);
        
        App.showToast(`گزارش با فرمت CSV با موفقیت دانلود شد`, 'success');
        return true;
    },
    
    // ===== خروجی JSON =====
    exportToJSON: function(data, filename) {
        if (!data || data.length === 0) {
            App.showToast('داده‌ای برای خروجی وجود ندارد', 'warning');
            return false;
        }
        
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        this.downloadBlob(blob, `${filename}.json`);
        
        App.showToast(`گزارش با فرمت JSON با موفقیت دانلود شد`, 'success');
        return true;
    },
    
    // ===== خروجی Excel (HTML) =====
    exportToExcel: function(data, headers, filename) {
        if (!data || data.length === 0) {
            App.showToast('داده‌ای برای خروجی وجود ندارد', 'warning');
            return false;
        }
        
        let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${filename}</title>
                <style>
                    th { background: #3B82F6; color: white; padding: 8px; }
                    td { padding: 6px; border: 1px solid #ddd; }
                    table { border-collapse: collapse; width: 100%; }
                </style>
            </head>
            <body>
                <h2>${filename}</h2>
                <table>
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${headers.map(header => `<td>${row[this.getKeyFromHeader(header)] || ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p>تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}</p>
            </body>
            </html>
        `;
        
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        this.downloadBlob(blob, `${filename}.xls`);
        
        App.showToast(`گزارش با فرمت Excel با موفقیت دانلود شد`, 'success');
        return true;
    },
    
    // ===== خروجی PDF =====
    exportToPDF: function(data, headers, filename, type) {
        App.showToast('در حال آماده‌سازی PDF...', 'info');
        
        // ایجاد پنجره چاپ
        const printWindow = window.open('', '_blank');
        
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${filename}</title>
                <style>
                    body { font-family: Vazir, Tahoma; direction: rtl; padding: 20px; }
                    h1 { color: #3B82F6; text-align: center; }
                    h3 { color: #6B7280; margin-top: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #3B82F6; color: white; padding: 10px; text-align: right; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: right; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9CA3AF; }
                    @media print {
                        body { margin: 0; padding: 10px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>${this.getReportTitle(type)}</h1>
                <p>تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}</p>
                <p>تعداد رکوردها: ${data.length}</p>
                
                <table>
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.slice(0, 500).map(row => `
                            <tr>
                                ${headers.map(header => `<td>${row[this.getKeyFromHeader(header)] || ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                ${data.length > 500 ? '<p class="footer">توجه: تنها 500 رکورد اول نمایش داده شده است</p>' : ''}
                <div class="footer">
                    <p>این گزارش به صورت خودکار توسط پلتفرم نوبت‌دهی هوشمند تولید شده است.</p>
                </div>
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()">چاپ / ذخیره PDF</button>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
        
        App.showToast(`پنجره چاپ باز شد. می‌توانید به عنوان PDF ذخیره کنید.`, 'success');
        return true;
    },
    
    // ===== دانلود فایل =====
    downloadBlob: function(blob, filename) {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    // ===== دریافت عنوان گزارش =====
    getReportTitle: function(type) {
        const titles = {
            bookings: 'گزارش نوبت‌ها',
            revenue: 'گزارش درآمد',
            users: 'گزارش کاربران',
            businesses: 'گزارش کسب‌وکارها',
            discounts: 'گزارش تخفیف‌ها'
        };
        return titles[type] || 'گزارش';
    },
    
    // ===== دریافت کلید از هدر =====
    getKeyFromHeader: function(header) {
        const keyMap = {
            'کد نوبت': 'id',
            'کسب‌وکار': 'business',
            'خدمت': 'service',
            'تاریخ': 'date',
            'ساعت': 'time',
            'مشتری': 'customer',
            'مبلغ': 'amount',
            'وضعیت': 'status',
            'نام': 'name',
            'شماره تماس': 'phone',
            'ایمیل': 'email',
            'تاریخ عضویت': 'createdAt',
            'تعداد نوبت': 'bookings',
            'کل هزینه': 'totalSpent',
            'مالک': 'owner',
            'آدرس': 'address',
            'تاریخ ثبت': 'createdAt',
            'کد تخفیف': 'code',
            'نوع': 'type',
            'مقدار': 'value',
            'تاریخ شروع': 'validFrom',
            'تاریخ پایان': 'validTo',
            'تعداد استفاده': 'usageCount',
            'درآمد روزانه': 'daily',
            'درآمد هفتگی': 'weekly',
            'درآمد ماهانه': 'monthly',
            'کارمزد': 'commission'
        };
        return keyMap[header] || header;
    },
    
    // ===== دریافت متن وضعیت =====
    getStatusText: function(status) {
        const statusMap = {
            pending: 'در انتظار',
            confirmed: 'تأیید شده',
            completed: 'انجام شده',
            cancelled: 'لغو شده'
        };
        return statusMap[status] || status;
    },
    
    // ===== نمایش مودال خروجی =====
    showExportModal: function() {
        const modal = document.createElement('div');
        modal.id = 'exportModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📎 خروجی گزارشات</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>نوع گزارش</label>
                        <select id="exportType" class="form-control">
                            <option value="bookings">گزارش نوبت‌ها</option>
                            <option value="revenue">گزارش درآمد</option>
                            <option value="users">گزارش کاربران</option>
                            <option value="businesses">گزارش کسب‌وکارها</option>
                            <option value="discounts">گزارش تخفیف‌ها</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>فرمت خروجی</label>
                        <select id="exportFormat" class="form-control">
                            <option value="csv">CSV</option>
                            <option value="excel">Excel</option>
                            <option value="json">JSON</option>
                            <option value="pdf">PDF</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>نام فایل (اختیاری)</label>
                        <input type="text" id="exportFilename" class="form-control" placeholder="در صورت خالی ماندن، نام خودکار انتخاب می‌شود">
                    </div>
                    <div class="date-range">
                        <div class="form-group">
                            <label>از تاریخ (اختیاری)</label>
                            <input type="date" id="exportStartDate" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>تا تاریخ (اختیاری)</label>
                            <input type="date" id="exportEndDate" class="form-control">
                        </div>
                    </div>
                    <button class="btn btn-primary btn-block" id="exportBtn">📥 دانلود گزارش</button>
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            const type = document.getElementById('exportType')?.value;
            const format = document.getElementById('exportFormat')?.value;
            let filename = document.getElementById('exportFilename')?.value;
            const startDate = document.getElementById('exportStartDate')?.value;
            const endDate = document.getElementById('exportEndDate')?.value;
            
            if (!filename) {
                filename = `${type}_${new Date().toISOString().split('T')[0]}`;
            }
            
            this.exportReport({
                type: type,
                format: format,
                filename: filename,
                filters: { startDate, endDate }
            });
            
            setTimeout(() => modal.remove(), 1000);
        });
    }
};

// استایل‌های خروجی
const exportStyles = `
<style>
.date-range {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
}
</style>
`;

if (!document.querySelector('#export-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'export-styles';
    styleSheet.textContent = exportStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    ExportReports.init();
});

window.ExportReports = ExportReports;
