 /* ============================================
   PUSH-NOTIFICATION.JS - نوتیفیکیشن مرورگر
   ============================================ */

const PushNotification = {
    // وضعیت
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    
    // تنظیمات
    config: {
        enabled: true,
        publicKey: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
        privateKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        autoRequest: true
    },
    
    // ===== مقداردهی اولیه =====
    init: async function() {
        this.checkSupport();
        await this.loadConfig();
        await this.checkSubscription();
        this.attachEvents();
        console.log('🔔 سرویس نوتیفیکیشن راه‌اندازی شد');
    },
    
    // ===== بررسی پشتیبانی مرورگر =====
    checkSupport: function() {
        this.isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
        
        if (!this.isSupported) {
            console.warn('مرورگر شما از نوتیفیکیشن پشتیبانی نمی‌کند');
        }
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: async function() {
        const saved = localStorage.getItem('push_config');
        if (saved) {
            try {
                this.config = JSON.parse(saved);
            } catch(e) {}
        }
        
        // درخواست خودکار مجوز
        if (this.config.autoRequest && this.isSupported && Notification.permission === 'default') {
            await this.requestPermission();
        }
    },
    
    // ===== ذخیره تنظیمات =====
    saveConfig: function() {
        localStorage.setItem('push_config', JSON.stringify(this.config));
    },
    
    // ===== بررسی وضعیت اشتراک =====
    checkSubscription: async function() {
        if (!this.isSupported) return;
        
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            this.isSubscribed = subscription !== null;
            this.subscription = subscription;
        } catch (error) {
            console.error('خطا در بررسی اشتراک:', error);
        }
    },
    
    // ===== درخواست مجوز =====
    requestPermission: async function() {
        if (!this.isSupported) {
            App.showToast('مرورگر شما از نوتیفیکیشن پشتیبانی نمی‌کند', 'error');
            return false;
        }
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            await this.subscribe();
            App.showToast('نوتیفیکیشن فعال شد', 'success');
            return true;
        } else {
            App.showToast('برای دریافت نوتیفیکیشن، لطفاً مجوز را فعال کنید', 'warning');
            return false;
        }
    },
    
    // ===== اشتراک در دریافت نوتیفیکیشن =====
    subscribe: async function() {
        if (!this.isSupported) return false;
        
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // در حالت واقعی، اینجا کلید عمومی از سرور دریافت می‌شود
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.config.publicKey)
            });
            
            this.subscription = subscription;
            this.isSubscribed = true;
            
            // ذخیره اشتراک در سرور
            await this.saveSubscriptionToServer(subscription);
            
            console.log('اشتراک نوتیفیکیشن با موفقیت ثبت شد');
            return true;
        } catch (error) {
            console.error('خطا در ثبت اشتراک:', error);
            return false;
        }
    },
    
    // ===== لغو اشتراک =====
    unsubscribe: async function() {
        if (!this.isSupported || !this.subscription) return false;
        
        try {
            await this.subscription.unsubscribe();
            this.isSubscribed = false;
            this.subscription = null;
            
            // حذف اشتراک از سرور
            await this.removeSubscriptionFromServer();
            
            App.showToast('نوتیفیکیشن غیرفعال شد', 'info');
            return true;
        } catch (error) {
            console.error('خطا در لغو اشتراک:', error);
            return false;
        }
    },
    
    // ===== ذخیره اشتراک در سرور =====
    saveSubscriptionToServer: async function(subscription) {
        // در حالت واقعی، اینجا اطلاعات اشتراک به سرور ارسال می‌شود
        console.log('اشتراک در سرور ذخیره شد:', subscription);
        localStorage.setItem('push_subscription', JSON.stringify(subscription));
    },
    
    // ===== حذف اشتراک از سرور =====
    removeSubscriptionFromServer: async function() {
        console.log('اشتراک از سرور حذف شد');
        localStorage.removeItem('push_subscription');
    },
    
    // ===== ارسال نوتیفیکیشن =====
    sendNotification: async function(title, options = {}) {
        if (!this.isSupported) {
            console.warn('نوتیفیکیشن پشتیبانی نمی‌شود');
            return false;
        }
        
        if (Notification.permission !== 'granted') {
            console.warn('مجوز نوتیفیکیشن داده نشده است');
            return false;
        }
        
        const defaultOptions = {
            body: '',
            icon: '/assets/images/logo/logo-light.svg',
            badge: '/assets/images/logo/favicon.ico',
            vibrate: [200, 100, 200],
            data: {
                url: '/',
                timestamp: Date.now()
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // ارسال نوتیفیکیشن
        const notification = new Notification(title, finalOptions);
        
        // رویداد کلیک روی نوتیفیکیشن
        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            if (finalOptions.data.url) {
                window.location.href = finalOptions.data.url;
            }
            notification.close();
        };
        
        return notification;
    },
    
    // ===== ارسال نوتیفیکیشن نوبت جدید =====
    sendBookingNotification: function(booking) {
        const title = '✅ نوبت شما ثبت شد!';
        const options = {
            body: `${booking.business.name} - ${new Date(booking.date).toLocaleDateString('fa-IR')} ساعت ${booking.time}`,
            icon: '/assets/images/logo/logo-light.svg',
            data: {
                url: '/profile?tab=bookings',
                bookingId: booking.id
            }
        };
        
        this.sendNotification(title, options);
    },
    
    // ===== ارسال نوتیفیکیشن یادآور =====
    sendReminderNotification: function(booking) {
        const title = '⏰ یادآوری نوبت';
        const options = {
            body: `فردا ساعت ${booking.time} نوبت در ${booking.business.name} دارید`,
            icon: '/assets/images/logo/logo-light.svg',
            data: {
                url: '/profile?tab=bookings',
                bookingId: booking.id
            }
        };
        
        this.sendNotification(title, options);
    },
    
    // ===== ارسال نوتیفیکیشن تخفیف =====
    sendDiscountNotification: function(discount) {
        const title = '🎉 تخفیف ویژه!';
        const options = {
            body: `${discount.name} - ${discount.percent}% تخفیف`,
            icon: '/assets/images/logo/logo-light.svg',
            data: {
                url: '/discounts'
            }
        };
        
        this.sendNotification(title, options);
    },
    
    // ===== ارسال نوتیفیکیشن پیام =====
    sendMessageNotification: function(sender, message) {
        const title = `پیام جدید از ${sender}`;
        const options = {
            body: message.length > 50 ? message.substring(0, 50) + '...' : message,
            icon: '/assets/images/logo/logo-light.svg',
            data: {
                url: '/messages'
            }
        };
        
        this.sendNotification(title, options);
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('booking:created', (booking) => {
            this.sendBookingNotification(booking);
        });
        
        App.on('discount:applied', (discount) => {
            this.sendDiscountNotification(discount);
        });
        
        App.on('reminder:trigger', (booking) => {
            this.sendReminderNotification(booking);
        });
    },
    
    // ===== نمایش تنظیمات نوتیفیکیشن =====
    showSettingsModal: function() {
        const modal = document.createElement('div');
        modal.id = 'pushSettingsModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔔 تنظیمات نوتیفیکیشن</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="notification-status">
                        <div class="status-row">
                            <span>وضعیت:</span>
                            <strong class="${this.isSubscribed ? 'text-success' : 'text-danger'}">
                                ${this.isSubscribed ? 'فعال' : 'غیرفعال'}
                            </strong>
                        </div>
                        <div class="status-row">
                            <span>مجوز:</span>
                            <strong>${Notification.permission === 'granted' ? 'داده شده' : Notification.permission === 'denied' ? 'رد شده' : 'درخواست نشده'}</strong>
                        </div>
                    </div>
                    
                    <div class="notification-actions">
                        ${!this.isSubscribed ? 
                            `<button class="btn btn-primary" id="enablePushBtn">🔔 فعال کردن نوتیفیکیشن</button>` :
                            `<button class="btn btn-outline" id="disablePushBtn">🔕 غیرفعال کردن نوتیفیکیشن</button>`
                        }
                        <button class="btn btn-outline" id="testNotificationBtn">📢 تست نوتیفیکیشن</button>
                    </div>
                    
                    <div class="notification-info">
                        <h4>ℹ️ درباره نوتیفیکیشن</h4>
                        <ul>
                            <li>با فعال کردن نوتیفیکیشن، از وضعیت نوبت‌ها مطلع می‌شوید</li>
                            <li>یادآور نوبت‌ها به صورت خودکار ارسال می‌شوند</li>
                            <li>تخفیف‌های ویژه را از دست نمی‌دهید</li>
                        </ul>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('enablePushBtn')?.addEventListener('click', async () => {
            await this.requestPermission();
            modal.remove();
            setTimeout(() => this.showSettingsModal(), 100);
        });
        
        document.getElementById('disablePushBtn')?.addEventListener('click', async () => {
            await this.unsubscribe();
            modal.remove();
            setTimeout(() => this.showSettingsModal(), 100);
        });
        
        document.getElementById('testNotificationBtn')?.addEventListener('click', () => {
            this.sendNotification('تست نوتیفیکیشن', {
                body: 'اگر این پیام را می‌بینید، نوتیفیکیشن به درستی کار می‌کند!',
                icon: '/assets/images/logo/logo-light.svg'
            });
            App.showToast('نوتیفیکیشن تست ارسال شد', 'success');
        });
    },
    
    // ===== تبدیل URL base64 به Uint8Array =====
    urlBase64ToUint8Array: function(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    },
    
    // ===== تغییر وضعیت سرویس =====
    setEnabled: function(enabled) {
        this.config.enabled = enabled;
        this.saveConfig();
        App.showToast(`نوتیفیکیشن ${enabled ? 'فعال' : 'غیرفعال'} شد`, 'info');
    }
};

// استایل‌های نوتیفیکیشن
const pushStyles = `
<style>
.notification-status {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
}

.status-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
}

.status-row:last-child {
    border-bottom: none;
}

.notification-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.notification-info {
    background: var(--color-primary-soft);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
}

.notification-info h4 {
    margin-bottom: 10px;
}

.notification-info ul {
    padding-right: 20px;
}

.notification-info li {
    margin-bottom: 5px;
    font-size: 13px;
}

.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }
</style>
`;

if (!document.querySelector('#push-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'push-styles';
    styleSheet.textContent = pushStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    PushNotification.init();
});

window.PushNotification = PushNotification;
