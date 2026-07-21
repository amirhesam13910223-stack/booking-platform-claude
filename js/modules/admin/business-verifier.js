 /* ============================================
   BUSINESS-VERIFIER.JS - تأیید کسب‌وکارها
   ============================================ */

const BusinessVerifier = {
    // لیست کسب‌وکارهای در انتظار تأیید
    pendingBusinesses: [],
    
    // لیست کسب‌وکارهای تأیید شده
    verifiedBusinesses: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadBusinesses();
        this.attachEvents();
        console.log('🏢 ماژول تأیید کسب‌وکارها راه‌اندازی شد');
    },
    
    // ===== بارگذاری کسب‌وکارها =====
    loadBusinesses: function() {
        const allBusinesses = JSON.parse(localStorage.getItem('businesses_list') || '[]');
        this.pendingBusinesses = allBusinesses.filter(b => b.status === 'pending');
        this.verifiedBusinesses = allBusinesses.filter(b => b.status === 'verified');
        
        // کسب‌وکار نمونه
        if (allBusinesses.length === 0) {
            const sampleBusiness = {
                id: 'BIZ001',
                name: 'سالن زیبایی لیدا',
                ownerName: 'مریم احمدی',
                phone: '02112345678',
                email: 'lida@example.com',
                address: 'تهران، سعادت‌آباد',
                licenseNumber: '1234567890',
                documents: ['license.pdf', 'id_card.pdf'],
                status: 'pending',
                submittedAt: new Date().toISOString(),
                description: 'سالن زیبایی تخصصی با ۱۰ سال سابقه'
            };
            this.pendingBusinesses.push(sampleBusiness);
            this.saveBusinesses();
        }
    },
    
    // ===== ذخیره کسب‌وکارها =====
    saveBusinesses: function() {
        const allBusinesses = [...this.pendingBusinesses, ...this.verifiedBusinesses];
        localStorage.setItem('businesses_list', JSON.stringify(allBusinesses));
        
        // ذخیره جداگانه برای کسب‌وکارها
        this.pendingBusinesses.forEach(b => {
            localStorage.setItem(`business_${b.id}`, JSON.stringify(b));
        });
        this.verifiedBusinesses.forEach(b => {
            localStorage.setItem(`business_${b.id}`, JSON.stringify(b));
        });
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('business:verify', (data) => {
            this.verifyBusiness(data.businessId);
        });
        
        App.on('business:reject', (data) => {
            this.rejectBusiness(data.businessId, data.reason);
        });
    },
    
    // ===== تأیید کسب‌وکار =====
    verifyBusiness: function(businessId) {
        const index = this.pendingBusinesses.findIndex(b => b.id === businessId);
        if (index !== -1) {
            const business = this.pendingBusinesses[index];
            business.status = 'verified';
            business.verifiedAt = new Date().toISOString();
            business.verifiedBy = AuthSession.getUser()?.id;
            
            this.pendingBusinesses.splice(index, 1);
            this.verifiedBusinesses.push(business);
            this.saveBusinesses();
            
            App.showToast(`کسب‌وکار ${business.name} با موفقیت تأیید شد`, 'success');
            App.emit('business:verified', business);
            
            // ارسال ایمیل/پیامک به صاحب کسب‌وکار
            this.sendVerificationNotification(business, 'approved');
            return true;
        }
        return false;
    },
    
    // ===== رد کسب‌وکار =====
    rejectBusiness: function(businessId, reason) {
        const index = this.pendingBusinesses.findIndex(b => b.id === businessId);
        if (index !== -1) {
            const business = this.pendingBusinesses[index];
            business.status = 'rejected';
            business.rejectedAt = new Date().toISOString();
            business.rejectionReason = reason;
            
            this.pendingBusinesses.splice(index, 1);
            this.saveBusinesses();
            
            App.showToast(`کسب‌وکار ${business.name} رد شد`, 'warning');
            App.emit('business:rejected', business);
            
            // ارسال ایمیل/پیامک به صاحب کسب‌وکار
            this.sendVerificationNotification(business, 'rejected', reason);
            return true;
        }
        return false;
    },
    
    // ===== ارسال نوتیفیکیشن =====
    sendVerificationNotification: function(business, status, reason = null) {
        const message = status === 'approved' 
            ? `کسب‌وکار شما با موفقیت تأیید شد. اکنون می‌توانید از پنل کسب‌وکار استفاده کنید.`
            : `متأسفانه درخواست ثبت‌نام کسب‌وکار شما تأیید نشد. دلیل: ${reason}`;
        
        console.log(`📧 ارسال ایمیل به ${business.email}: ${message}`);
        // در حالت واقعی، اینجا ایمیل واقعی ارسال می‌شود
    },
    
    // ===== مشاهده جزئیات کسب‌وکار =====
    viewBusinessDetails: function(business) {
        const modal = document.createElement('div');
        modal.id = 'businessDetailsModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🏢 جزئیات کسب‌وکار</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="business-details">
                        <div class="detail-row">
                            <span>نام کسب‌وکار:</span>
                            <strong>${business.name}</strong>
                        </div>
                        <div class="detail-row">
                            <span>نام مالک:</span>
                            <strong>${business.ownerName}</strong>
                        </div>
                        <div class="detail-row">
                            <span>شماره تماس:</span>
                            <strong>${business.phone}</strong>
                        </div>
                        <div class="detail-row">
                            <span>ایمیل:</span>
                            <strong>${business.email}</strong>
                        </div>
                        <div class="detail-row">
                            <span>آدرس:</span>
                            <strong>${business.address}</strong>
                        </div>
                        <div class="detail-row">
                            <span>شماره مجوز:</span>
                            <strong>${business.licenseNumber || '-'}</strong>
                        </div>
                        <div class="detail-row">
                            <span>تاریخ ثبت:</span>
                            <strong>${this.formatDate(business.submittedAt)}</strong>
                        </div>
                        <div class="detail-row">
                            <span>توضیحات:</span>
                            <strong>${business.description || '-'}</strong>
                        </div>
                        ${business.documents ? `
                            <div class="detail-row">
                                <span>مدارک:</span>
                                <div class="documents-list">
                                    ${business.documents.map(doc => `<a href="#" class="document-link">📄 ${doc}</a>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="verification-actions">
                        <button class="btn btn-success" id="approveBusinessBtn">✅ تأیید</button>
                        <button class="btn btn-danger" id="rejectBusinessBtn">❌ رد</button>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('approveBusinessBtn')?.addEventListener('click', () => {
            this.verifyBusiness(business.id);
            modal.remove();
            setTimeout(() => this.showVerificationPanel(), 100);
        });
        
        document.getElementById('rejectBusinessBtn')?.addEventListener('click', () => {
            const reason = prompt('لطفاً دلیل رد درخواست را وارد کنید:');
            if (reason) {
                this.rejectBusiness(business.id, reason);
                modal.remove();
                setTimeout(() => this.showVerificationPanel(), 100);
            }
        });
    },
    
    // ===== نمایش پنل تأیید =====
    showVerificationPanel: function() {
        const modal = document.createElement('div');
        modal.id = 'verificationPanel';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>🏢 تأیید کسب‌وکارها</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="verification-tabs">
                        <button class="tab-btn active" data-tab="pending">در انتظار تأیید (${this.pendingBusinesses.length})</button>
                        <button class="tab-btn" data-tab="verified">تأیید شده (${this.verifiedBusinesses.length})</button>
                    </div>
                    
                    <div id="pendingTab" class="tab-content active">
                        ${this.renderPendingList()}
                    </div>
                    
                    <div id="verifiedTab" class="tab-content">
                        ${this.renderVerifiedList()}
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
        
        // دکمه‌های مشاهده جزئیات
        document.querySelectorAll('.view-business').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const businessId = e.target.dataset.id;
                const business = [...this.pendingBusinesses, ...this.verifiedBusinesses].find(b => b.id === businessId);
                if (business) {
                    this.viewBusinessDetails(business);
                    modal.remove();
                }
            });
        });
    },
    
    // ===== رندر لیست در انتظار =====
    renderPendingList: function() {
        if (this.pendingBusinesses.length === 0) {
            return '<div class="empty-state">هیچ کسب‌وکاری در انتظار تأیید نیست</div>';
        }
        
        return `
            <div class="business-list">
                ${this.pendingBusinesses.map(business => `
                    <div class="business-card">
                        <div class="business-header">
                            <h4>${business.name}</h4>
                            <span class="status pending">در انتظار</span>
                        </div>
                        <div class="business-info">
                            <p>👤 ${business.ownerName}</p>
                            <p>📞 ${business.phone}</p>
                            <p>📧 ${business.email}</p>
                            <p>📍 ${business.address}</p>
                        </div>
                        <div class="business-actions">
                            <button class="btn btn-outline btn-small view-business" data-id="${business.id}">مشاهده جزئیات</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    // ===== رندر لیست تأیید شده =====
    renderVerifiedList: function() {
        if (this.verifiedBusinesses.length === 0) {
            return '<div class="empty-state">هیچ کسب‌وکاری تأیید نشده است</div>';
        }
        
        return `
            <div class="business-list">
                ${this.verifiedBusinesses.map(business => `
                    <div class="business-card verified">
                        <div class="business-header">
                            <h4>${business.name}</h4>
                            <span class="status verified">تأیید شده</span>
                        </div>
                        <div class="business-info">
                            <p>👤 ${business.ownerName}</p>
                            <p>📞 ${business.phone}</p>
                            <p>📧 ${business.email}</p>
                            <p>📍 ${business.address}</p>
                        </div>
                        <div class="business-actions">
                            <button class="btn btn-outline btn-small view-business" data-id="${business.id}">مشاهده جزئیات</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    // ===== فرمت تاریخ =====
    formatDate: function(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fa-IR');
    }
};

// استایل‌های تأیید کسب‌وکارها
const verifierStyles = `
<style>
.verification-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
}

.business-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 15px;
    max-height: 400px;
    overflow-y: auto;
}

.business-card {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 15px;
    transition: all var(--transition-fast);
}

.business-card.verified {
    border-left: 4px solid var(--color-success);
}

.business-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
}

.business-header h4 {
    margin: 0;
}

.status {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.status.pending {
    background: var(--color-warning-soft);
    color: var(--color-warning);
}

.status.verified {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.business-info p {
    margin: 5px 0;
    font-size: 13px;
}

.business-actions {
    margin-top: 10px;
    text-align: left;
}

.business-details {
    margin-bottom: 20px;
}

.documents-list {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.document-link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 13px;
}

.verification-actions {
    display: flex;
    gap: 10px;
    margin: 20px 0;
}

.btn-success {
    background-color: var(--color-success);
    color: white;
}

.btn-success:hover {
    background-color: var(--color-success-dark);
}
</style>
`;

if (!document.querySelector('#verifier-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'verifier-styles';
    styleSheet.textContent = verifierStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    BusinessVerifier.init();
});

window.BusinessVerifier = BusinessVerifier;
