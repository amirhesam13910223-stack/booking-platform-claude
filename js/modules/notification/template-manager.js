 /* ============================================
   TEMPLATE-MANAGER.JS - مدیریت قالب‌ها
   ============================================ */

const TemplateManager = {
    // قالب‌ها
    templates: {
        // قالب‌های پیامک
        sms: {
            booking_confirmation: {
                name: 'تأیید نوبت',
                template: '✅ نوبت شما با کد {booking_id} در {business_name} برای تاریخ {date} ساعت {time} ثبت شد.',
                variables: ['booking_id', 'business_name', 'date', 'time']
            },
            booking_reminder: {
                name: 'یادآوری نوبت',
                template: '⏰ یادآوری: فردا ساعت {time} نوبت در {business_name} - آدرس: {address}',
                variables: ['business_name', 'date', 'time', 'address']
            },
            cancellation: {
                name: 'لغو نوبت',
                template: '❌ نوبت شما در {business_name} لغو شد. مبلغ {refund_amount} تومان بازگشت داده شد.',
                variables: ['business_name', 'refund_amount']
            },
            welcome: {
                name: 'خوش‌آمدگویی',
                template: '🎉 به پلتفرم نوبت‌دهی خوش آمدید {user_name}! {points} امتیاز هدیه دریافت کردید.',
                variables: ['user_name', 'points']
            },
            payment_success: {
                name: 'پرداخت موفق',
                template: '💰 پرداخت مبلغ {amount} تومان با موفقیت انجام شد. کد رهگیری: {ref_id}',
                variables: ['amount', 'ref_id']
            }
        },
        
        // قالب‌های ایمیل
        email: {
            booking_confirmation_email: {
                name: 'تأیید نوبت (ایمیل)',
                template: `
                    <div style="font-family: Vazir, Tahoma;">
                        <h2>✅ تأیید نوبت</h2>
                        <p>{customer_name} عزیز،</p>
                        <p>نوبت شما با موفقیت ثبت شد. جزئیات نوبت:</p>
                        <ul>
                            <li>کد رهگیری: {booking_id}</li>
                            <li>کسب‌وکار: {business_name}</li>
                            <li>تاریخ: {date}</li>
                            <li>ساعت: {time}</li>
                            <li>آدرس: {address}</li>
                        </ul>
                        <p>با تشکر</p>
                    </div>
                `,
                variables: ['customer_name', 'booking_id', 'business_name', 'date', 'time', 'address']
            },
            welcome_email: {
                name: 'خوش‌آمدگویی (ایمیل)',
                template: `
                    <div style="font-family: Vazir, Tahoma;">
                        <h2>🎉 خوش آمدید!</h2>
                        <p>{user_name} عزیز،</p>
                        <p>به پلتفرم نوبت‌دهی هوشمند خوش آمدید.</p>
                        <p>✨ {points} امتیاز هدیه به حساب شما اضافه شد.</p>
                        <p>💎 کد تخفیف {coupon_code} برای اولین نوبت شما فعال است.</p>
                        <p>برای شروع رزرو، به سایت مراجعه کنید.</p>
                    </div>
                `,
                variables: ['user_name', 'points', 'coupon_code']
            }
        },
        
        // قالب‌های اعلان درون برنامه‌ای
        inapp: {
            booking_created: {
                name: 'نوبت جدید',
                template: '✅ نوبت شما در {business_name} برای تاریخ {date} ساعت {time} ثبت شد',
                variables: ['business_name', 'date', 'time']
            },
            reminder_24h: {
                name: 'یادآوری ۲۴ ساعته',
                template: '⏰ یادآوری: فردا ساعت {time} نوبت در {business_name} دارید',
                variables: ['business_name', 'time']
            },
            discount_offer: {
                name: 'تخفیف ویژه',
                template: '🎁 تخفیف ویژه {percent}% برای شما! کد: {code}',
                variables: ['percent', 'code']
            }
        }
    },
    
    // قالب‌های سفارشی کاربر
    customTemplates: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadCustomTemplates();
        this.attachEvents();
        console.log('📝 سرویس مدیریت قالب‌ها راه‌اندازی شد');
    },
    
    // ===== بارگذاری قالب‌های سفارشی =====
    loadCustomTemplates: function() {
        const saved = localStorage.getItem('custom_templates');
        if (saved) {
            try {
                this.customTemplates = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره قالب‌های سفارشی =====
    saveCustomTemplates: function() {
        localStorage.setItem('custom_templates', JSON.stringify(this.customTemplates));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('template:render', (data) => {
            return this.renderTemplate(data.templateName, data.params, data.type);
        });
        
        App.on('template:add', (data) => {
            this.addCustomTemplate(data);
        });
        
        App.on('template:remove', (data) => {
            this.removeCustomTemplate(data.templateId);
        });
    },
    
    // ===== رندر قالب =====
    renderTemplate: function(templateName, params = {}, type = 'sms') {
        let template = null;
        
        // جستجو در قالب‌های پیش‌فرض
        if (this.templates[type] && this.templates[type][templateName]) {
            template = this.templates[type][templateName].template;
        }
        
        // جستجو در قالب‌های سفارشی
        if (!template) {
            const custom = this.customTemplates.find(t => t.name === templateName && t.type === type);
            if (custom) {
                template = custom.template;
            }
        }
        
        if (!template) {
            console.warn(`قالب ${templateName} یافت نشد`);
            return null;
        }
        
        // جایگزینی متغیرها
        let rendered = template;
        for (const [key, value] of Object.entries(params)) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            rendered = rendered.replace(regex, value);
        }
        
        return rendered;
    },
    
    // ===== افزودن قالب سفارشی =====
    addCustomTemplate: function(data) {
        const { name, type, template, variables, description } = data;
        
        const newTemplate = {
            id: 'TPL' + Date.now() + Math.floor(Math.random() * 10000),
            name: name,
            type: type, // sms, email, inapp
            template: template,
            variables: variables || this.extractVariables(template),
            description: description || '',
            createdAt: new Date().toISOString()
        };
        
        this.customTemplates.push(newTemplate);
        this.saveCustomTemplates();
        
        App.showToast(`قالب ${name} با موفقیت اضافه شد`, 'success');
        App.emit('template:added', newTemplate);
        
        return newTemplate;
    },
    
    // ===== حذف قالب سفارشی =====
    removeCustomTemplate: function(templateId) {
        const index = this.customTemplates.findIndex(t => t.id === templateId);
        if (index !== -1) {
            const removed = this.customTemplates[index];
            this.customTemplates.splice(index, 1);
            this.saveCustomTemplates();
            App.showToast(`قالب ${removed.name} حذف شد`, 'info');
            return true;
        }
        return false;
    },
    
    // ===== استخراج متغیرها از قالب =====
    extractVariables: function(template) {
        const regex = /{([^}]+)}/g;
        const variables = [];
        let match;
        
        while ((match = regex.exec(template)) !== null) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        
        return variables;
    },
    
    // ===== دریافت لیست قالب‌ها =====
    getTemplates: function(type = null) {
        const allTemplates = [];
        
        // قالب‌های پیش‌فرض
        for (const [tType, tpls] of Object.entries(this.templates)) {
            if (type && tType !== type) continue;
            for (const [key, tpl] of Object.entries(tpls)) {
                allTemplates.push({
                    id: key,
                    name: tpl.name,
                    type: tType,
                    template: tpl.template,
                    variables: tpl.variables,
                    isDefault: true
                });
            }
        }
        
        // قالب‌های سفارشی
        const customs = this.customTemplates.filter(t => !type || t.type === type);
        allTemplates.push(...customs.map(t => ({ ...t, isDefault: false })));
        
        return allTemplates;
    },
    
    // ===== پیش‌نمایش قالب =====
    previewTemplate: function(templateName, type = 'sms') {
        const template = this.getTemplate(templateName, type);
        if (!template) return null;
        
        // نمونه مقادیر برای متغیرها
        const sampleParams = {};
        for (const variable of template.variables) {
            sampleParams[variable] = `[${variable}]`;
        }
        
        return this.renderTemplate(templateName, sampleParams, type);
    },
    
    // ===== دریافت قالب =====
    getTemplate: function(templateName, type = 'sms') {
        // جستجو در قالب‌های پیش‌فرض
        if (this.templates[type] && this.templates[type][templateName]) {
            return {
                ...this.templates[type][templateName],
                id: templateName,
                type: type,
                isDefault: true
            };
        }
        
        // جستجو در قالب‌های سفارشی
        const custom = this.customTemplates.find(t => t.name === templateName && t.type === type);
        if (custom) {
            return { ...custom, isDefault: false };
        }
        
        return null;
    },
    
    // ===== نمایش پنل مدیریت قالب‌ها =====
    showTemplatePanel: function() {
        const templates = this.getTemplates();
        
        const modal = document.createElement('div');
        modal.id = 'templatePanel';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>📝 مدیریت قالب‌ها</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="template-actions">
                        <button class="btn btn-primary" id="addTemplateBtn">➕ افزودن قالب جدید</button>
                    </div>
                    
                    <div class="template-filters">
                        <select id="templateTypeFilter" class="form-control">
                            <option value="all">همه قالب‌ها</option>
                            <option value="sms">پیامک</option>
                            <option value="email">ایمیل</option>
                            <option value="inapp">اعلان درون برنامه‌ای</option>
                        </select>
                    </div>
                    
                    <div class="templates-list">
                        ${this.renderTemplatesList(templates)}
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('addTemplateBtn')?.addEventListener('click', () => {
            this.showAddTemplateForm();
            modal.remove();
        });
        
        document.getElementById('templateTypeFilter')?.addEventListener('change', (e) => {
            const type = e.target.value;
            const filtered = type === 'all' ? templates : templates.filter(t => t.type === type);
            document.querySelector('.templates-list').innerHTML = this.renderTemplatesList(filtered);
            this.attachTemplateActions();
        });
        
        this.attachTemplateActions();
    },
    
    // ===== رندر لیست قالب‌ها =====
    renderTemplatesList: function(templates) {
        if (templates.length === 0) {
            return '<div class="empty-state">هیچ قالبی یافت نشد</div>';
        }
        
        return templates.map(template => `
            <div class="template-card" data-id="${template.id}">
                <div class="template-header">
                    <h4>${template.name}</h4>
                    <span class="template-type ${template.type}">${this.getTypeName(template.type)}</span>
                    ${!template.isDefault ? '<span class="custom-badge">سفارشی</span>' : ''}
                </div>
                <div class="template-preview">
                    <small>پیش‌نمایش:</small>
                    <p>${this.previewTemplate(template.id, template.type) || template.template.substring(0, 100)}...</p>
                </div>
                <div class="template-variables">
                    <small>متغیرها:</small>
                    <div class="variable-chips">
                        ${template.variables.map(v => `<span class="variable-chip">{${v}}</span>`).join('')}
                    </div>
                </div>
                <div class="template-actions">
                    <button class="btn btn-outline btn-small preview-template" data-id="${template.id}" data-type="${template.type}">👁️ پیش‌نمایش</button>
                    ${!template.isDefault ? 
                        `<button class="btn btn-outline btn-small edit-template" data-id="${template.id}">✏️ ویرایش</button>
                         <button class="btn btn-outline btn-small delete-template" data-id="${template.id}">🗑️ حذف</button>` : ''
                    }
                </div>
            </div>
        `).join('');
    },
    
    // ===== اتصال دکمه‌های قالب =====
    attachTemplateActions: function() {
        document.querySelectorAll('.preview-template').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.dataset.id;
                const type = e.target.dataset.type;
                const template = this.getTemplate(templateId, type);
                if (template) {
                    this.showPreviewModal(template);
                }
            });
        });
        
        document.querySelectorAll('.edit-template').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.dataset.id;
                const template = this.customTemplates.find(t => t.id === templateId);
                if (template) {
                    this.showEditTemplateForm(template);
                    const modal = document.getElementById('templatePanel');
                    if (modal) modal.remove();
                }
            });
        });
        
        document.querySelectorAll('.delete-template').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.dataset.id;
                if (confirm('آیا از حذف این قالب مطمئن هستید؟')) {
                    this.removeCustomTemplate(templateId);
                    const modal = document.getElementById('templatePanel');
                    if (modal) modal.remove();
                    setTimeout(() => this.showTemplatePanel(), 100);
                }
            });
        });
    },
    
    // ===== نمایش مودال افزودن قالب =====
    showAddTemplateForm: function() {
        const modal = document.createElement('div');
        modal.id = 'addTemplateModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>➕ افزودن قالب جدید</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addTemplateForm">
                        <div class="form-group">
                            <label>نام قالب</label>
                            <input type="text" id="templateName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>نوع</label>
                            <select id="templateType" class="form-control" required>
                                <option value="sms">پیامک</option>
                                <option value="email">ایمیل</option>
                                <option value="inapp">اعلان درون برنامه‌ای</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>قالب</label>
                            <textarea id="templateContent" class="form-control" rows="6" placeholder="مثال: سلام {user_name} عزیز..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label>توضیحات (اختیاری)</label>
                            <textarea id="templateDescription" class="form-control" rows="2"></textarea>
                        </div>
                        <div class="variables-hint">
                            <small>💡 متغیرهای قابل استفاده: با قرار دادن {نام_متغیر} در متن قالب مشخص می‌شوند</small>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                            <button type="submit" class="btn btn-primary">افزودن قالب</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('addTemplateForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('templateName')?.value;
            const type = document.getElementById('templateType')?.value;
            const template = document.getElementById('templateContent')?.value;
            const description = document.getElementById('templateDescription')?.value;
            
            if (name && template) {
                this.addCustomTemplate({
                    name: name,
                    type: type,
                    template: template,
                    description: description
                });
                modal.remove();
                setTimeout(() => this.showTemplatePanel(), 100);
            } else {
                App.showToast('لطفاً نام و متن قالب را وارد کنید', 'error');
            }
        });
    },
    
    // ===== نمایش مودال ویرایش قالب =====
    showEditTemplateForm: function(template) {
        const modal = document.createElement('div');
        modal.id = 'editTemplateModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>✏️ ویرایش قالب</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editTemplateForm">
                        <div class="form-group">
                            <label>نام قالب</label>
                            <input type="text" id="templateName" class="form-control" value="${template.name}" required>
                        </div>
                        <div class="form-group">
                            <label>نوع</label>
                            <select id="templateType" class="form-control" disabled>
                                <option value="sms" ${template.type === 'sms' ? 'selected' : ''}>پیامک</option>
                                <option value="email" ${template.type === 'email' ? 'selected' : ''}>ایمیل</option>
                                <option value="inapp" ${template.type === 'inapp' ? 'selected' : ''}>اعلان درون برنامه‌ای</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>قالب</label>
                            <textarea id="templateContent" class="form-control" rows="6" required>${template.template}</textarea>
                        </div>
                        <div class="form-group">
                            <label>توضیحات</label>
                            <textarea id="templateDescription" class="form-control" rows="2">${template.description || ''}</textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                            <button type="submit" class="btn btn-primary">ذخیره تغییرات</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('editTemplateForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updatedTemplate = {
                ...template,
                name: document.getElementById('templateName')?.value,
                template: document.getElementById('templateContent')?.value,
                description: document.getElementById('templateDescription')?.value,
                variables: this.extractVariables(document.getElementById('templateContent')?.value)
            };
            
            const index = this.customTemplates.findIndex(t => t.id === template.id);
            if (index !== -1) {
                this.customTemplates[index] = updatedTemplate;
                this.saveCustomTemplates();
                App.showToast('قالب با موفقیت ویرایش شد', 'success');
                modal.remove();
                setTimeout(() => this.showTemplatePanel(), 100);
            }
        });
    },
    
    // ===== نمایش مودال پیش‌نمایش =====
    showPreviewModal: function(template) {
        const preview = this.renderTemplate(template.id, {}, template.type);
        
        const modal = document.createElement('div');
        modal.id = 'previewModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👁️ پیش‌نمایش قالب: ${template.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="preview-content">
                        <h4>متن قالب:</h4>
                        <pre>${template.template}</pre>
                        <h4>پیش‌نمایش:</h4>
                        <div class="preview-result">${preview || template.template}</div>
                        <h4>متغیرهای قابل استفاده:</h4>
                        <div class="variable-chips">
                            ${template.variables.map(v => `<span class="variable-chip">{${v}}</span>`).join('')}
                        </div>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    },
    
    // ===== دریافت نام نوع =====
    getTypeName: function(type) {
        const names = {
            sms: 'پیامک',
            email: 'ایمیل',
            inapp: 'اعلان درون برنامه‌ای'
        };
        return names[type] || type;
    }
};

// استایل‌های مدیریت قالب
const templateStyles = `
<style>
.template-actions {
    margin-bottom: 20px;
}

.template-filters {
    margin-bottom: 20px;
    max-width: 200px;
}

.templates-list {
    max-height: 500px;
    overflow-y: auto;
}

.template-card {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 15px;
}

.template-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.template-header h4 {
    margin: 0;
}

.template-type {
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.template-type.sms {
    background: var(--color-primary-soft);
    color: var(--color-primary);
}

.template-type.email {
    background: var(--color-secondary-soft);
    color: var(--color-secondary);
}

.template-type.inapp {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.custom-badge {
    background: var(--color-info-soft);
    color: var(--color-info);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.template-preview {
    background: var(--bg-secondary);
    padding: 10px;
    border-radius: var(--radius-sm);
    margin: 10px 0;
}

.template-preview p {
    margin: 5px 0 0;
    font-size: 13px;
    color: var(--text-secondary);
}

.template-variables {
    margin: 10px 0;
}

.variable-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 5px;
}

.variable-chip {
    background: var(--color-gray-200);
    padding: 2px 6px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-family: monospace;
}

.template-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    justify-content: flex-end;
}

.variables-hint {
    background: var(--color-info-soft);
    padding: 8px;
    border-radius: var(--radius-sm);
    margin: 10px 0;
    font-size: 12px;
}

.preview-content pre {
    background: var(--bg-secondary);
    padding: 10px;
    border-radius: var(--radius-sm);
    overflow-x: auto;
    font-size: 12px;
    margin: 10px 0;
}

.preview-result {
    background: var(--bg-secondary);
    padding: 10px;
    border-radius: var(--radius-sm);
    margin: 10px 0;
}
</style>
`;

if (!document.querySelector('#template-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'template-styles';
    styleSheet.textContent = templateStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    TemplateManager.init();
});

window.TemplateManager = TemplateManager;
