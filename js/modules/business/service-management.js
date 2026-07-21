 /* ============================================
   SERVICE-MANAGEMENT.JS - مدیریت خدمات
   ============================================ */

const ServiceManagement = {
    // لیست خدمات
    servicesList: [],
    
    // کسب‌وکار فعلی
    businessId: null,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadServicesList();
        this.attachEvents();
        console.log('🔧 ماژول مدیریت خدمات راه‌اندازی شد');
    },
    
    // ===== بارگذاری لیست خدمات =====
    loadServicesList: function() {
        const user = AuthSession.getUser();
        if (!user || user.role !== 'business') return;
        
        this.businessId = user.id;
        const saved = localStorage.getItem(`services_${this.businessId}`);
        if (saved) {
            try {
                this.servicesList = JSON.parse(saved);
            } catch(e) {}
        }
        
        // خدمات نمونه
        if (this.servicesList.length === 0) {
            this.servicesList = [
                {
                    id: 'SRV001',
                    name: 'کوتاهی مو زنانه',
                    category: 'آرایشی',
                    duration: 45,
                    price: 250000,
                    discountPrice: null,
                    description: 'کوتاهی مو با جدیدترین متدها',
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'SRV002',
                    name: 'رنگ مو',
                    category: 'آرایشی',
                    duration: 120,
                    price: 450000,
                    discountPrice: 380000,
                    description: 'رنگ مو با بهترین مواد',
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'SRV003',
                    name: 'ماسک مو',
                    category: 'مراقبتی',
                    duration: 30,
                    price: 150000,
                    discountPrice: null,
                    description: 'ماسک ترمیم کننده مو',
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'SRV004',
                    name: 'حنا گذاری',
                    category: 'آرایشی',
                    duration: 60,
                    price: 200000,
                    discountPrice: 180000,
                    description: 'حنا گذاری با طرح‌های متنوع',
                    active: true,
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveServicesList();
        }
    },
    
    // ===== ذخیره لیست خدمات =====
    saveServicesList: function() {
        if (this.businessId) {
            localStorage.setItem(`services_${this.businessId}`, JSON.stringify(this.servicesList));
        }
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('service:add', (data) => {
            this.addService(data);
        });
        
        App.on('service:remove', (data) => {
            this.removeService(data.serviceId);
        });
        
        App.on('service:update', (data) => {
            this.updateService(data);
        });
    },
    
    // ===== افزودن خدمت جدید =====
    addService: function(serviceData) {
        const newService = {
            id: 'SRV' + Date.now() + Math.floor(Math.random() * 1000),
            ...serviceData,
            active: true,
            createdAt: new Date().toISOString()
        };
        
        this.servicesList.push(newService);
        this.saveServicesList();
        
        App.showToast(`خدمت ${newService.name} با موفقیت اضافه شد`, 'success');
        App.emit('service:added', newService);
        
        return newService;
    },
    
    // ===== حذف خدمت =====
    removeService: function(serviceId) {
        const index = this.servicesList.findIndex(s => s.id === serviceId);
        if (index !== -1) {
            const removedService = this.servicesList[index];
            this.servicesList.splice(index, 1);
            this.saveServicesList();
            App.showToast(`خدمت ${removedService.name} حذف شد`, 'info');
            App.emit('service:removed', removedService);
            return true;
        }
        return false;
    },
    
    // ===== به‌روزرسانی اطلاعات خدمت =====
    updateService: function(updatedData) {
        const index = this.servicesList.findIndex(s => s.id === updatedData.id);
        if (index !== -1) {
            this.servicesList[index] = { ...this.servicesList[index], ...updatedData };
            this.saveServicesList();
            App.showToast(`خدمت ${this.servicesList[index].name} به‌روزرسانی شد`, 'success');
            App.emit('service:updated', this.servicesList[index]);
            return true;
        }
        return false;
    },
    
    // ===== دریافت خدمات فعال =====
    getActiveServices: function() {
        return this.servicesList.filter(s => s.active);
    },
    
    // ===== دریافت خدمات بر اساس دسته =====
    getServicesByCategory: function(category) {
        return this.servicesList.filter(s => s.category === category && s.active);
    },
    
    // ===== دریافت دسته‌بندی خدمات =====
    getServiceCategories: function() {
        const categories = [...new Set(this.servicesList.map(s => s.category))];
        return categories;
    },
    
    // ===== نمایش مودال مدیریت خدمات =====
    showServiceModal: function() {
        const categories = this.getServiceCategories();
        
        const modal = document.createElement('div');
        modal.id = 'serviceModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>🔧 مدیریت خدمات</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="service-actions">
                        <button class="btn btn-primary" id="addServiceBtn">➕ افزودن خدمت جدید</button>
                    </div>
                    
                    <div class="service-filters">
                        <select id="categoryFilter" class="form-control">
                            <option value="all">همه دسته‌ها</option>
                            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="service-list">
                        <h4>لیست خدمات</h4>
                        <div class="service-table">
                            <div class="table-header">
                                <span>نام خدمت</span>
                                <span>دسته</span>
                                <span>مدت (دقیقه)</span>
                                <span>قیمت (تومان)</span>
                                <span>قیمت تخفیف</span>
                                <span>وضعیت</span>
                                <span>عملیات</span>
                            </div>
                            <div id="servicesTableBody">
                                ${this.renderServicesTable(this.servicesList)}
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('addServiceBtn')?.addEventListener('click', () => {
            this.showAddServiceForm();
            modal.remove();
        });
        
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            const category = e.target.value;
            const filteredServices = category === 'all' 
                ? this.servicesList 
                : this.servicesList.filter(s => s.category === category);
            document.getElementById('servicesTableBody').innerHTML = this.renderServicesTable(filteredServices);
        });
        
        document.querySelectorAll('.edit-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceId = e.target.dataset.id;
                const service = this.servicesList.find(s => s.id === serviceId);
                if (service) {
                    this.showEditServiceForm(service);
                    modal.remove();
                }
            });
        });
        
        document.querySelectorAll('.delete-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceId = e.target.dataset.id;
                if (confirm('آیا از حذف این خدمت مطمئن هستید؟')) {
                    this.removeService(serviceId);
                    modal.remove();
                    setTimeout(() => this.showServiceModal(), 100);
                }
            });
        });
        
        document.querySelectorAll('.toggle-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceId = e.target.dataset.id;
                const service = this.servicesList.find(s => s.id === serviceId);
                if (service) {
                    this.updateService({ id: serviceId, active: !service.active });
                    modal.remove();
                    setTimeout(() => this.showServiceModal(), 100);
                }
            });
        });
    },
    
    // ===== رندر جدول خدمات =====
    renderServicesTable: function(services) {
        if (services.length === 0) {
            return '<div class="empty-state">هیچ خدمتی یافت نشد</div>';
        }
        
        return services.map(service => `
            <div class="table-row">
                <span><strong>${service.name}</strong></span>
                <span>${service.category}</span>
                <span>${service.duration} دقیقه</span>
                <span>${this.formatPrice(service.price)}</span>
                <span>${service.discountPrice ? this.formatPrice(service.discountPrice) : '-'}</span>
                <span class="service-status ${service.active ? 'active' : 'inactive'}">${service.active ? 'فعال' : 'غیرفعال'}</span>
                <span>
                    <button class="icon-btn edit-service" data-id="${service.id}" title="ویرایش">✏️</button>
                    <button class="icon-btn toggle-service" data-id="${service.id}" title="${service.active ? 'غیرفعال' : 'فعال'}">${service.active ? '🔴' : '🟢'}</button>
                    <button class="icon-btn delete-service" data-id="${service.id}" title="حذف">🗑️</button>
                </span>
            </div>
        `).join('');
    },
    
    // ===== نمایش فرم افزودن خدمت =====
    showAddServiceForm: function() {
        const modal = document.createElement('div');
        modal.id = 'addServiceFormModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>➕ افزودن خدمت جدید</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addServiceForm">
                        <div class="form-group">
                            <label>نام خدمت</label>
                            <input type="text" id="serviceName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>دسته‌بندی</label>
                            <input type="text" id="serviceCategory" class="form-control" placeholder="مثال: آرایشی, پزشکی, مراقبتی" required>
                        </div>
                        <div class="form-group">
                            <label>مدت زمان (دقیقه)</label>
                            <input type="number" id="serviceDuration" class="form-control" min="5" max="240" required>
                        </div>
                        <div class="form-group">
                            <label>قیمت (تومان)</label>
                            <input type="number" id="servicePrice" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>قیمت تخفیف (اختیاری)</label>
                            <input type="number" id="serviceDiscountPrice" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>توضیحات</label>
                            <textarea id="serviceDescription" class="form-control" rows="3"></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">انصراف</button>
                            <button type="submit" class="btn btn-primary">افزودن خدمت</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('addServiceForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const serviceData = {
                name: document.getElementById('serviceName')?.value,
                category: document.getElementById('serviceCategory')?.value,
                duration: parseInt(document.getElementById('serviceDuration')?.value),
                price: parseInt(document.getElementById('servicePrice')?.value),
                discountPrice: document.getElementById('serviceDiscountPrice')?.value ? parseInt(document.getElementById('serviceDiscountPrice')?.value) : null,
                description: document.getElementById('serviceDescription')?.value
            };
            
            if (serviceData.name && serviceData.category && serviceData.duration && serviceData.price) {
                this.addService(serviceData);
                modal.remove();
                setTimeout(() => this.showServiceModal(), 100);
            } else {
                App.showToast('لطفاً تمام فیلدهای الزامی را پر کنید', 'error');
            }
        });
    },
    
    // ===== نمایش فرم ویرایش خدمت =====
    showEditServiceForm: function(service) {
        const modal = document.createElement('div');
        modal.id = 'editServiceFormModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>✏️ ویرایش خدمت</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editServiceForm">
                        <div class="form-group">
                            <label>نام خدمت</label>
                            <input type="text" id="serviceName" class="form-control" value="${service.name}" required>
                        </div>
                        <div class="form-group">
                            <label>دسته‌بندی</label>
                            <input type="text" id="serviceCategory" class="form-control" value="${service.category}" required>
                        </div>
                        <div class="form-group">
                            <label>مدت زمان (دقیقه)</label>
                            <input type="number" id="serviceDuration" class="form-control" value="${service.duration}" required>
                        </div>
                        <div class="form-group">
                            <label>قیمت (تومان)</label>
                            <input type="number" id="servicePrice" class="form-control" value="${service.price}" required>
                        </div>
                        <div class="form-group">
                            <label>قیمت تخفیف</label>
                            <input type="number" id="serviceDiscountPrice" class="form-control" value="${service.discountPrice || ''}">
                        </div>
                        <div class="form-group">
                            <label>توضیحات</label>
                            <textarea id="serviceDescription" class="form-control" rows="3">${service.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="serviceActive" ${service.active ? 'checked' : ''}> فعال
                            </label>
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
        
        document.getElementById('editServiceForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updatedService = {
                id: service.id,
                name: document.getElementById('serviceName')?.value,
                category: document.getElementById('serviceCategory')?.value,
                duration: parseInt(document.getElementById('serviceDuration')?.value),
                price: parseInt(document.getElementById('servicePrice')?.value),
                discountPrice: document.getElementById('serviceDiscountPrice')?.value ? parseInt(document.getElementById('serviceDiscountPrice')?.value) : null,
                description: document.getElementById('serviceDescription')?.value,
                active: document.getElementById('serviceActive')?.checked
            };
            
            this.updateService(updatedService);
            modal.remove();
            setTimeout(() => this.showServiceModal(), 100);
        });
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰';
        return price.toLocaleString('fa-IR');
    }
};

// استایل‌های مدیریت خدمات
const serviceStyles = `
<style>
.service-actions {
    margin-bottom: 20px;
}

.service-filters {
    margin-bottom: 20px;
    max-width: 200px;
}

.service-table {
    margin-top: 15px;
    overflow-x: auto;
}

.table-header, .table-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr 0.8fr 1fr 1fr 0.8fr 1fr;
    gap: 10px;
    padding: 10px;
    border-bottom: 1px solid var(--border-color);
    align-items: center;
}

.table-header {
    background: var(--bg-secondary);
    font-weight: bold;
    border-radius: var(--radius-md);
}

.service-status {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
    text-align: center;
}

.service-status.active {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.service-status.inactive {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: var(--text-tertiary);
}

@media (max-width: 768px) {
    .table-header, .table-row {
        grid-template-columns: 1fr;
        gap: 5px;
    }
    
    .table-header {
        display: none;
    }
    
    .table-row {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        margin-bottom: 10px;
        position: relative;
        padding: 15px;
    }
}
</style>
`;

if (!document.querySelector('#service-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'service-styles';
    styleSheet.textContent = serviceStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    ServiceManagement.init();
});

window.ServiceManagement = ServiceManagement;
