/* ============================================
   DISPUTE-RESOLVER.JS - حل اختلافات
   ============================================ */

   const DisputeResolver = {
    // لیست اختلافات
    disputes: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadDisputes();
        this.attachEvents();
        console.log('⚖️ ماژول حل اختلافات راه‌اندازی شد');
    },
    
    // ===== بارگذاری اختلافات =====
    loadDisputes: function() {
        const saved = localStorage.getItem('disputes');
        if (saved) {
            try {
                this.disputes = JSON.parse(saved);
            } catch(e) {}
        }
        
        // اختلافات نمونه
        if (this.disputes.length === 0) {
            this.disputes = [
                {
                    id: 'DSP001',
                    type: 'booking',
                    bookingId: 'BK1703123456789',
                    title: 'عدم ارائه خدمت',
                    description: 'خدمت دریافتی با توضیحات مغایرت داشت',
                    reporterId: 1,
                    reporterName: 'سارا محمدی',
                    reporterRole: 'user',
                    respondentId: 'BIZ001',
                    respondentName: 'سالن زیبایی لیدا',
                    respondentRole: 'business',
                    status: 'open',
                    priority: 'high',
                    createdAt: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
                    messages: [
                        {
                            senderId: 1,
                            senderName: 'سارا محمدی',
                            message: 'خدمتی که دریافت کردم با چیزی که توضیح داده شده بود完全不同 بود',
                            timestamp: new Date(Date.now() - 5*24*60*60*1000).toISOString()
                        }
                    ],
                    resolution: null
                },
                {
                    id: 'DSP002',
                    type: 'payment',
                    bookingId: 'BK1703123456790',
                    title: 'مشکل پرداخت',
                    description: 'پرداخت انجام شده اما نوبت ثبت نشده است',
                    reporterId: 'BIZ002',
                    reporterName: 'کلینیک دکتر محمدی',
                    reporterRole: 'business',
                    respondentId: 2,
                    respondentName: 'رضا کریمی',
                    respondentRole: 'user',
                    status: 'investigating',
                    priority: 'medium',
                    createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
                    messages: [],
                    resolution: null
                }
            ];
            this.saveDisputes();
        }
    },
    
    // ===== ذخیره اختلافات =====
    saveDisputes: function() {
        localStorage.setItem('disputes', JSON.stringify(this.disputes));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('dispute:create', (data) => {
            this.createDispute(data);
        });
        
        App.on('dispute:resolve', (data) => {
            this.resolveDispute(data);
        });
    },
    
    // ===== ایجاد اختلاف جدید =====
    createDispute: function(data) {
        const newDispute = {
            id: 'DSP' + Date.now() + Math.floor(Math.random() * 10000),
            type: data.type,
            bookingId: data.bookingId,
            title: data.title,
            description: data.description,
            reporterId: data.reporterId,
            reporterName: data.reporterName,
            reporterRole: data.reporterRole,
            respondentId: data.respondentId,
            respondentName: data.respondentName,
            respondentRole: data.respondentRole,
            status: 'open',
            priority: this.calculatePriority(data),
            createdAt: new Date().toISOString(),
            messages: [],
            resolution: null
        };
        
        this.disputes.unshift(newDispute);
        this.saveDisputes();
        
        App.showToast('اختلاف با موفقیت ثبت شد. در اسرع وقت بررسی می‌شود.', 'success');
        App.emit('dispute:created', newDispute);
        
        return newDispute;
    },
    
    // ===== محاسبه اولویت =====
    calculatePriority: function(data) {
        if (data.type === 'payment') return 'high';
        if (data.type === 'cancellation') return 'medium';
        return 'low';
    },
    
    // ===== افزودن پیام =====
    addMessage: function(disputeId, senderId, senderName, message) {
        const dispute = this.disputes.find(d => d.id === disputeId);
        if (dispute) {
            dispute.messages.push({
                senderId: senderId,
                senderName: senderName,
                message: message,
                timestamp: new Date().toISOString()
            });
            this.saveDisputes();
            
            App.showToast('پیام با موفقیت ارسال شد', 'success');
            App.emit('dispute:message-added', { disputeId, message });
        }
    },
    
    // ===== حل اختلاف =====
    resolveDispute: function(data) {
        const { disputeId, resolution, decision, refundAmount = 0 } = data;
        const dispute = this.disputes.find(d => d.id === disputeId);
        
        if (dispute) {
            dispute.status = 'resolved';
            dispute.resolution = {
                decision: decision,
                refundAmount: refundAmount,
                resolvedAt: new Date().toISOString(),
                resolvedBy: AuthSession.getUser()?.id,
                note: resolution
            };
            
            this.saveDisputes();
            
            App.showToast('اختلاف با موفقیت حل شد', 'success');
            App.emit('dispute:resolved', dispute);
            
            // در صورت نیاز به بازپرداخت
            if (refundAmount > 0) {
                this.processRefund(dispute, refundAmount);
            }
            
            return true;
        }
        return false;
    },
    
    // ===== پردازش بازپرداخت =====
    processRefund: function(dispute, amount) {
        // در حالت واقعی، اینجا درخواست بازپرداخت به درگاه ارسال می‌شود
        console.log(`💰 بازپرداخت مبلغ ${amount} تومان برای اختلاف ${dispute.id} پردازش شد`);
        App.showToast(`بازپرداخت مبلغ ${this.formatPrice(amount)} انجام شد`, 'success');
    },
    
    // ===== نمایش مودال مدیریت اختلافات =====
    showDisputesModal: function() {
        const modal = document.createElement('div');
        modal.id = 'disputesModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>⚖️ مدیریت اختلافات</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="dispute-filters">
                        <select id="disputeStatusFilter" class="form-control">
                            <option value="all">همه</option>
                            <option value="open">در انتظار بررسی</option>
                            <option value="investigating">در حال بررسی</option>
                            <option value="resolved">حل شده</option>
                        </select>
                        <select id="disputePriorityFilter" class="form-control">
                            <option value="all">همه اولویت‌ها</option>
                            <option value="high">بالا</option>
                            <option value="medium">متوسط</option>
                            <option value="low">پایین</option>
                        </select>
                    </div>
                    
                    <div class="disputes-list">
                        ${this.renderDisputesList()}
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // فیلترها
        const statusFilter = document.getElementById('disputeStatusFilter');
        const priorityFilter = document.getElementById('disputePriorityFilter');
        
        const filterDisputes = () => {
            const status = statusFilter?.value;
            const priority = priorityFilter?.value;
            
            let filtered = this.disputes;
            
            if (status !== 'all') {
                filtered = filtered.filter(d => d.status === status);
            }
            
            if (priority !== 'all') {
                filtered = filtered.filter(d => d.priority === priority);
            }
            
            const listContainer = document.querySelector('.disputes-list');
            if (listContainer) {
                listContainer.innerHTML = this.renderDisputesList(filtered);
                this.attachDisputeActions();
            }
        };
        
        statusFilter?.addEventListener('change', filterDisputes);
        priorityFilter?.addEventListener('change', filterDisputes);
        
        this.attachDisputeActions();
    },
    
    // ===== رندر لیست اختلافات =====
    renderDisputesList: function(disputes = null) {
        const items = disputes || this.disputes;
        
        if (items.length === 0) {
            return '<div class="empty-state">هیچ اختلافی ثبت نشده است</div>';
        }
        
        return items.map(dispute => `
            <div class="dispute-card ${dispute.status}" data-id="${dispute.id}">
                <div class="dispute-header">
                    <div class="dispute-title">
                        <span class="priority-badge ${dispute.priority}">${this.getPriorityName(dispute.priority)}</span>
                        <h4>${dispute.title}</h4>
                    </div>
                    <span class="status-badge ${dispute.status}">${this.getStatusName(dispute.status)}</span>
                </div>
                <div class="dispute-info">
                    <p><strong>نوع:</strong> ${this.getTypeName(dispute.type)}</p>
                    <p><strong>گزارش‌دهنده:</strong> ${dispute.reporterName} (${dispute.reporterRole === 'user' ? 'کاربر' : 'کسب‌وکار'})</p>
                    <p><strong>طرف مقابل:</strong> ${dispute.respondentName} (${dispute.respondentRole === 'user' ? 'کاربر' : 'کسب‌وکار'})</p>
                    <p><strong>تاریخ:</strong> ${this.formatDate(dispute.createdAt)}</p>
                    <p class="dispute-description">${dispute.description}</p>
                </div>
                <div class="dispute-actions">
                    <button class="btn btn-outline btn-small view-dispute" data-id="${dispute.id}">مشاهده و بررسی</button>
                    ${dispute.status !== 'resolved' ? 
                        `<button class="btn btn-primary btn-small resolve-dispute" data-id="${dispute.id}">حل اختلاف</button>` : ''}
                </div>
            </div>
        `).join('');
    },
    
    // ===== نمایش جزئیات اختلاف =====
    showDisputeDetail: function(disputeId) {
        const dispute = this.disputes.find(d => d.id === disputeId);
        if (!dispute) return;
        
        const modal = document.createElement('div');
        modal.id = 'disputeDetailModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>⚖️ جزئیات اختلاف - ${dispute.title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="dispute-detail-info">
                        <div class="info-row">
                            <span>شناسه:</span>
                            <strong>${dispute.id}</strong>
                        </div>
                        <div class="info-row">
                            <span>نوع:</span>
                            <strong>${this.getTypeName(dispute.type)}</strong>
                        </div>
                        <div class="info-row">
                            <span>اولویت:</span>
                            <strong class="priority-${dispute.priority}">${this.getPriorityName(dispute.priority)}</strong>
                        </div>
                        <div class="info-row">
                            <span>وضعیت:</span>
                            <strong class="status-${dispute.status}">${this.getStatusName(dispute.status)}</strong>
                        </div>
                        <div class="info-row">
                            <span>گزارش‌دهنده:</span>
                            <strong>${dispute.reporterName} (${dispute.reporterRole === 'user' ? 'کاربر' : 'کسب‌وکار'})</strong>
                        </div>
                        <div class="info-row">
                            <span>طرف مقابل:</span>
                            <strong>${dispute.respondentName} (${dispute.respondentRole === 'user' ? 'کاربر' : 'کسب‌وکار'})</strong>
                        </div>
                        <div class="info-row">
                            <span>توضیحات:</span>
                            <p class="description-text">${dispute.description}</p>
                        </div>
                    </div>
                    
                    <div class="dispute-messages">
                        <h4>گفتگو</h4>
                        <div class="messages-list" id="messagesList">
                            ${this.renderMessages(dispute.messages)}
                        </div>
                        <div class="message-input">
                            <textarea id="newMessage" class="form-control" rows="2" placeholder="پیام خود را وارد کنید..."></textarea>
                            <button class="btn btn-primary" id="sendMessageBtn">ارسال پیام</button>
                        </div>
                    </div>
                    
                    ${dispute.status !== 'resolved' ? `
                        <div class="resolution-section">
                            <h4>حل اختلاف</h4>
                            <div class="form-group">
                                <label>تصمیم نهایی</label>
                                <select id="resolutionDecision" class="form-control">
                                    <option value="user_win">به نفع کاربر</option>
                                    <option value="business_win">به نفع کسب‌وکار</option>
                                    <option value="partial">قسمتی به نفع هر دو</option>
                                    <option value="cancel">ابطال درخواست</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>مبلغ بازپرداخت (تومان)</label>
                                <input type="number" id="refundAmount" class="form-control" value="0">
                            </div>
                            <div class="form-group">
                                <label>توضیحات حل اختلاف</label>
                                <textarea id="resolutionNote" class="form-control" rows="3"></textarea>
                            </div>
                            <button class="btn btn-success" id="finalResolveBtn">تأیید و حل اختلاف</button>
                        </div>
                    ` : `
                        <div class="resolution-result">
                            <h4>نتیجه حل اختلاف</h4>
                            <div class="info-row">
                                <span>تصمیم:</span>
                                <strong>${this.getDecisionName(dispute.resolution?.decision)}</strong>
                            </div>
                            <div class="info-row">
                                <span>بازپرداخت:</span>
                                <strong>${this.formatPrice(dispute.resolution?.refundAmount)}</strong>
                            </div>
                            <div class="info-row">
                                <span>توضیحات:</span>
                                <p>${dispute.resolution?.note || '-'}</p>
                            </div>
                        </div>
                    `}
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // ارسال پیام
        document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
            const message = document.getElementById('newMessage')?.value;
            if (message && message.trim()) {
                const user = AuthSession.getUser();
                this.addMessage(dispute.id, user?.id, user?.name || 'ادمین', message);
                
                // به‌روزرسانی پیام‌ها
                const messagesList = document.getElementById('messagesList');
                if (messagesList) {
                    dispute.messages.push({
                        senderId: user?.id,
                        senderName: user?.name || 'ادمین',
                        message: message,
                        timestamp: new Date().toISOString()
                    });
                    messagesList.innerHTML = this.renderMessages(dispute.messages);
                    document.getElementById('newMessage').value = '';
                }
            }
        });
        
        // حل اختلاف
        document.getElementById('finalResolveBtn')?.addEventListener('click', () => {
            const decision = document.getElementById('resolutionDecision')?.value;
            const refundAmount = parseInt(document.getElementById('refundAmount')?.value) || 0;
            const resolution = document.getElementById('resolutionNote')?.value;
            
            if (confirm('آیا از حل این اختلاف مطمئن هستید؟')) {
                this.resolveDispute({
                    disputeId: dispute.id,
                    decision: decision,
                    refundAmount: refundAmount,
                    resolution: resolution
                });
                modal.remove();
                setTimeout(() => this.showDisputesModal(), 100);
            }
        });
    },
    
    // ===== رندر پیام‌ها =====
    renderMessages: function(messages) {
        if (messages.length === 0) {
            return '<div class="empty-state">هیچ پیامی وجود ندارد</div>';
        }
        
        return messages.map(msg => `
            <div class="message-item">
                <div class="message-header">
                    <strong>${msg.senderName}</strong>
                    <span class="message-time">${this.formatDateTime(msg.timestamp)}</span>
                </div>
                <div class="message-body">${msg.message}</div>
            </div>
        `).join('');
    },
    
    // ===== اتصال دکمه‌های اختلافات =====
    attachDisputeActions: function() {
        document.querySelectorAll('.view-dispute').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const disputeId = e.target.dataset.id;
                this.showDisputeDetail(disputeId);
                
                const modal = document.getElementById('disputesModal');
                if (modal) modal.remove();
            });
        });
        
        document.querySelectorAll('.resolve-dispute').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const disputeId = e.target.dataset.id;
                this.showDisputeDetail(disputeId);
                
                const modal = document.getElementById('disputesModal');
                if (modal) modal.remove();
            });
        });
    },
    
    // ===== توابع کمکی =====
    getTypeName: function(type) {
        const names = {
            'booking': 'نوبت',
            'payment': 'پرداخت',
            'cancellation': 'کنسلی',
            'service': 'خدمت'
        };
        return names[type] || type;
    },
    
    getPriorityName: function(priority) {
        const names = {
            'high': 'بالا',
            'medium': 'متوسط',
            'low': 'پایین'
        };
        return names[priority] || priority;
    },
    
    getStatusName: function(status) {
        const names = {
            'open': 'در انتظار',
            'investigating': 'در حال بررسی',
            'resolved': 'حل شده'
        };
        return names[status] || status;
    },
    
    getDecisionName: function(decision) {
        const names = {
            'user_win': 'به نفع کاربر',
            'business_win': 'به نفع کسب‌وکار',
            'partial': 'قسمتی به نفع هر دو',
            'cancel': 'ابطال درخواست'
        };
        return names[decision] || decision;
    },
    
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    },
    
    formatDate: function(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fa-IR');
    },
    
    formatDateTime: function(date) {
        if (!date) return '-';
        const d = new Date(date);
        return `${d.toLocaleDateString('fa-IR')} ${d.toLocaleTimeString('fa-IR')}`;
    }
};

// استایل‌های حل اختلافات
const disputeStyles = `
<style>
.dispute-filters {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.disputes-list {
    max-height: 500px;
    overflow-y: auto;
}

.dispute-card {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 15px;
    transition: all var(--transition-fast);
}

.dispute-card.open {
    border-right: 4px solid var(--color-danger);
}

.dispute-card.investigating {
    border-right: 4px solid var(--color-warning);
}

.dispute-card.resolved {
    border-right: 4px solid var(--color-success);
}

.dispute-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 10px;
}

.dispute-title {
    display: flex;
    align-items: center;
    gap: 10px;
}

.dispute-title h4 {
    margin: 0;
}

.priority-badge {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.priority-badge.high {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.priority-badge.medium {
    background: var(--color-warning-soft);
    color: var(--color-warning);
}

.priority-badge.low {
    background: var(--color-info-soft);
    color: var(--color-info);
}

.status-badge {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.status-badge.open {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.status-badge.investigating {
    background: var(--color-warning-soft);
    color: var(--color-warning);
}

.status-badge.resolved {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.dispute-info p {
    margin: 5px 0;
    font-size: 13px;
}

.dispute-description {
    background: var(--bg-secondary);
    padding: 8px;
    border-radius: var(--radius-sm);
    margin-top: 8px;
}

.dispute-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    justify-content: flex-end;
}

.dispute-detail-info {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
}

.dispute-messages {
    margin-bottom: 20px;
}

.messages-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 10px;
    margin-bottom: 10px;
}

.message-item {
    padding: 10px;
    border-bottom: 1px solid var(--border-color);
}

.message-item:last-child {
    border-bottom: none;
}

.message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
}

.message-time {
    font-size: 11px;
    color: var(--text-tertiary);
}

.message-body {
    font-size: 14px;
}

.message-input {
    display: flex;
    gap: 10px;
}

.message-input textarea {
    flex: 1;
}

.resolution-section, .resolution-result {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-top: 20px;
}

.description-text {
    background: var(--bg-primary);
    padding: 10px;
    border-radius: var(--radius-sm);
    margin-top: 5px;
}
</style>
`;

if (!document.querySelector('#dispute-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dispute-styles';
    styleSheet.textContent = disputeStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    DisputeResolver.init();
});

window.DisputeResolver = DisputeResolver;
