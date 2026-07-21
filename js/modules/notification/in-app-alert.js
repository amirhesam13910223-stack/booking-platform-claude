 /* ============================================
   IN-APP-ALERT.JS - هشدار درون برنامه‌ای
   ============================================ */

const InAppAlert = {
    // صف اعلانات
    alertQueue: [],
    isShowing: false,
    
    // تنظیمات
    config: {
        autoHide: true,
        autoHideDelay: 5000,
        maxAlerts: 3,
        position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center
        animation: 'slide'
    },
    
    // انواع اعلان
    alertTypes: {
        success: { icon: '✅', color: '#10B981', bgColor: '#ECFDF5' },
        error: { icon: '❌', color: '#EF4444', bgColor: '#FEF2F2' },
        warning: { icon: '⚠️', color: '#F59E0B', bgColor: '#FFFBEB' },
        info: { icon: 'ℹ️', color: '#3B82F6', bgColor: '#EFF6FF' },
        booking: { icon: '📅', color: '#8B5CF6', bgColor: '#F3E8FF' },
        payment: { icon: '💰', color: '#10B981', bgColor: '#ECFDF5' },
        discount: { icon: '🎁', color: '#F59E0B', bgColor: '#FFFBEB' }
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadConfig();
        this.createContainer();
        this.attachEvents();
        console.log('🔔 سرویس هشدار درون برنامه‌ای راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: function() {
        const saved = localStorage.getItem('inapp_alert_config');
        if (saved) {
            try {
                this.config = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره تنظیمات =====
    saveConfig: function() {
        localStorage.setItem('inapp_alert_config', JSON.stringify(this.config));
    },
    
    // ===== ایجاد کانتینر اعلانات =====
    createContainer: function() {
        let container = document.getElementById('inapp-alert-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'inapp-alert-container';
            container.className = `inapp-alert-container ${this.config.position}`;
            document.body.appendChild(container);
        }
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('alert:show', (data) => {
            this.show(data);
        });
        
        App.on('alert:success', (data) => {
            this.success(data.message, data.title, data.options);
        });
        
        App.on('alert:error', (data) => {
            this.error(data.message, data.title, data.options);
        });
        
        App.on('alert:warning', (data) => {
            this.warning(data.message, data.title, data.options);
        });
        
        App.on('alert:info', (data) => {
            this.info(data.message, data.title, data.options);
        });
    },
    
    // ===== نمایش اعلان =====
    show: function(data) {
        const { type, message, title, options = {} } = data;
        const alertType = this.alertTypes[type] || this.alertTypes.info;
        
        const alertId = 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        
        const alertElement = document.createElement('div');
        alertElement.id = alertId;
        alertElement.className = `inapp-alert ${type} ${this.config.animation}`;
        alertElement.style.backgroundColor = alertType.bgColor;
        alertElement.style.borderRightColor = alertType.color;
        
        alertElement.innerHTML = `
            <div class="alert-icon" style="color: ${alertType.color}">${alertType.icon}</div>
            <div class="alert-content">
                ${title ? `<div class="alert-title">${title}</div>` : ''}
                <div class="alert-message">${message}</div>
            </div>
            <button class="alert-close">&times;</button>
            ${options.progress ? `<div class="alert-progress"><div class="progress-bar" style="background-color: ${alertType.color}"></div></div>` : ''}
        `;
        
        const container = document.getElementById('inapp-alert-container');
        container.appendChild(alertElement);
        
        // انیمیشن ورود
        setTimeout(() => {
            alertElement.classList.add('show');
        }, 10);
        
        // دکمه بستن
        const closeBtn = alertElement.querySelector('.alert-close');
        closeBtn.addEventListener('click', () => {
            this.close(alertId);
        });
        
        // بستن خودکار
        if (this.config.autoHide && options.autoHide !== false) {
            const delay = options.delay || this.config.autoHideDelay;
            
            if (options.progress) {
                const progressBar = alertElement.querySelector('.progress-bar');
                progressBar.style.transition = `width ${delay}ms linear`;
                setTimeout(() => {
                    progressBar.style.width = '100%';
                }, 10);
            }
            
            setTimeout(() => {
                this.close(alertId);
            }, delay);
        }
        
        // محدودیت تعداد اعلانات همزمان
        const alerts = container.querySelectorAll('.inapp-alert');
        if (alerts.length > this.config.maxAlerts) {
            this.close(alerts[0].id);
        }
        
        return alertId;
    },
    
    // ===== بستن اعلان =====
    close: function(alertId) {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.classList.remove('show');
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            }, 300);
        }
    },
    
    // ===== بستن همه اعلانات =====
    closeAll: function() {
        const container = document.getElementById('inapp-alert-container');
        if (container) {
            const alerts = container.querySelectorAll('.inapp-alert');
            alerts.forEach(alert => this.close(alert.id));
        }
    },
    
    // ===== نمایش اعلان موفقیت =====
    success: function(message, title = 'موفقیت', options = {}) {
        return this.show({
            type: 'success',
            message: message,
            title: title,
            options: options
        });
    },
    
    // ===== نمایش اعلان خطا =====
    error: function(message, title = 'خطا', options = {}) {
        return this.show({
            type: 'error',
            message: message,
            title: title,
            options: options
        });
    },
    
    // ===== نمایش اعلان هشدار =====
    warning: function(message, title = 'هشدار', options = {}) {
        return this.show({
            type: 'warning',
            message: message,
            title: title,
            options: options
        });
    },
    
    // ===== نمایش اعلان اطلاع‌رسانی =====
    info: function(message, title = 'اطلاعیه', options = {}) {
        return this.show({
            type: 'info',
            message: message,
            title: title,
            options: options
        });
    },
    
    // ===== نمایش اعلان نوبت =====
    bookingAlert: function(booking) {
        const date = new Date(booking.date).toLocaleDateString('fa-IR');
        return this.show({
            type: 'booking',
            message: `نوبت شما در ${booking.business.name} برای تاریخ ${date} ساعت ${booking.time} ثبت شد`,
            title: '✅ ثبت نوبت',
            options: {
                progress: true,
                delay: 6000
            }
        });
    },
    
    // ===== نمایش اعلان یادآور =====
    reminderAlert: function(booking) {
        const date = new Date(booking.date).toLocaleDateString('fa-IR');
        return this.show({
            type: 'warning',
            message: `یادآوری: فردا ساعت ${booking.time} نوبت در ${booking.business.name} دارید`,
            title: '⏰ یادآوری نوبت',
            options: {
                progress: true,
                delay: 7000
            }
        });
    },
    
    // ===== نمایش اعلان تخفیف =====
    discountAlert: function(discount) {
        return this.show({
            type: 'discount',
            message: `${discount.name} - ${discount.percent}% تخفیف ویژه شما!`,
            title: '🎁 تخفیف ویژه',
            options: {
                progress: true,
                delay: 8000
            }
        });
    },
    
    // ===== نمایش اعلان پرداخت =====
    paymentAlert: function(amount, status) {
        const message = status === 'success' 
            ? `پرداخت مبلغ ${this.formatPrice(amount)} با موفقیت انجام شد`
            : `پرداخت مبلغ ${this.formatPrice(amount)} ناموفق بود`;
        
        return this.show({
            type: status === 'success' ? 'payment' : 'error',
            message: message,
            title: status === 'success' ? '💰 پرداخت موفق' : '❌ خطا در پرداخت',
            options: {
                progress: true,
                delay: 5000
            }
        });
    },
    
    // ===== تنظیم موقعیت =====
    setPosition: function(position) {
        const validPositions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center'];
        if (validPositions.includes(position)) {
            this.config.position = position;
            this.saveConfig();
            
            const container = document.getElementById('inapp-alert-container');
            if (container) {
                container.className = `inapp-alert-container ${position}`;
            }
            
            App.showToast(`موقعیت اعلانات به ${position} تغییر یافت`, 'success');
        }
    },
    
    // ===== تنظیم زمان خودکار =====
    setAutoHideDelay: function(delay) {
        this.config.autoHideDelay = delay;
        this.saveConfig();
    },
    
    // ===== فرمت قیمت =====
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    }
};

// استایل‌های اعلانات درون برنامه‌ای
const inappAlertStyles = `
<style>
.inapp-alert-container {
    position: fixed;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
}

.inapp-alert-container.top-right {
    top: 20px;
    right: 20px;
}

.inapp-alert-container.top-left {
    top: 20px;
    left: 20px;
}

.inapp-alert-container.bottom-right {
    bottom: 20px;
    right: 20px;
}

.inapp-alert-container.bottom-left {
    bottom: 20px;
    left: 20px;
}

.inapp-alert-container.top-center {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
}

.inapp-alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-right: 4px solid;
    min-width: 280px;
    max-width: 400px;
    pointer-events: auto;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

.inapp-alert.slide {
    transform: translateX(100%);
    opacity: 0;
}

.inapp-alert.slide.show {
    transform: translateX(0);
    opacity: 1;
}

.inapp-alert.fade {
    opacity: 0;
}

.inapp-alert.fade.show {
    opacity: 1;
}

.alert-icon {
    font-size: 24px;
}

.alert-content {
    flex: 1;
}

.alert-title {
    font-weight: bold;
    margin-bottom: 4px;
    font-size: 14px;
}

.alert-message {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
}

.alert-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--text-tertiary);
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
}

.alert-close:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
}

.alert-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(0, 0, 0, 0.1);
}

.progress-bar {
    width: 0%;
    height: 100%;
    transition: width linear;
}

@media (max-width: 640px) {
    .inapp-alert-container {
        left: 10px;
        right: 10px;
    }
    
    .inapp-alert-container.top-right,
    .inapp-alert-container.top-left,
    .inapp-alert-container.bottom-right,
    .inapp-alert-container.bottom-left {
        left: 10px;
        right: 10px;
    }
    
    .inapp-alert {
        max-width: none;
        width: auto;
    }
}
</style>
`;

if (!document.querySelector('#inapp-alert-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'inapp-alert-styles';
    styleSheet.textContent = inappAlertStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    InAppAlert.init();
});

window.InAppAlert = InAppAlert;
