 /* ============================================
   SMS-SENDER.JS - سرویس ارسال پیامک
   ============================================ */

const SMSSender = {
    // تنظیمات درگاه پیامک
    config: {
        provider: 'kavenegar', // kavenegar, smsir, farazsms
        apiKey: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
        senderNumber: '100020000',
        enabled: true,
        sandbox: true
    },
    
    // وضعیت ارسال
    sendQueue: [],
    isProcessing: false,
    
    // تاریخچه ارسال
    history: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadConfig();
        this.loadHistory();
        this.attachEvents();
        console.log('📱 سرویس پیامک راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: function() {
        const saved = localStorage.getItem('sms_config');
        if (saved) {
            try {
                this.config = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره تنظیمات =====
    saveConfig: function() {
        localStorage.setItem('sms_config', JSON.stringify(this.config));
    },
    
    // ===== بارگذاری تاریخچه =====
    loadHistory: function() {
        const saved = localStorage.getItem('sms_history');
        if (saved) {
            try {
                this.history = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره تاریخچه =====
    saveHistory: function() {
        localStorage.setItem('sms_history', JSON.stringify(this.history.slice(0, 500)));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('sms:send', (data) => {
            this.sendSMS(data);
        });
        
        App.on('sms:send-bulk', (data) => {
            this.sendBulkSMS(data);
        });
        
        App.on(SystemEvents.BOOKING_CREATED, (booking) => {
            this.sendBookingConfirmation(booking);
        });
        
        App.on(SystemEvents.BOOKING_CANCELLED, (booking) => {
            this.sendCancellationSMS(booking);
        });
    },
    
    // ===== ارسال پیامک تکی =====
    sendSMS: async function(data) {
        const { to, message, template, params, callback } = data;
        
        if (!this.config.enabled) {
            console.warn('سرویس پیامک غیرفعال است');
            if (callback) callback({ success: false, error: 'سرویس غیرفعال است' });
            return false;
        }
        
        let finalMessage = message;
        
        // استفاده از قالب
        if (template && window.TemplateManager) {
            finalMessage = window.TemplateManager.renderTemplate(template, params);
        }
        
        if (!to || !finalMessage) {
            console.error('شماره تماس یا متن پیامک نامعتبر است');
            if (callback) callback({ success: false, error: 'اطلاعات ناقص' });
            return false;
        }
        
        // اعتبارسنجی شماره تماس
        const phoneRegex = /^09[0-9]{9}$/;
        if (!phoneRegex.test(to)) {
            console.error('شماره تماس نامعتبر است:', to);
            if (callback) callback({ success: false, error: 'شماره تماس نامعتبر' });
            return false;
        }
        
        // افزودن به صف
        const smsJob = {
            id: 'SMS' + Date.now() + Math.floor(Math.random() * 10000),
            to: to,
            message: finalMessage,
            status: 'pending',
            attempts: 0,
            createdAt: new Date().toISOString(),
            callback: callback
        };
        
        this.sendQueue.push(smsJob);
        this.processQueue();
        
        return smsJob;
    },
    
    // ===== ارسال انبوه پیامک =====
    sendBulkSMS: async function(data) {
        const { recipients, message, template, params, callback } = data;
        
        if (!recipients || recipients.length === 0) {
            App.showToast('لیست گیرندگان خالی است', 'warning');
            return [];
        }
        
        App.showToast(`در حال ارسال پیامک به ${recipients.length} نفر...`, 'info');
        
        const results = [];
        let successCount = 0;
        
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const result = await this.sendSMS({
                to: recipient,
                message: message,
                template: template,
                params: params,
                callback: (res) => {
                    if (res.success) successCount++;
                }
            });
            results.push(result);
            
            // تأخیر بین پیامک‌ها (برای جلوگیری از مسدود شدن)
            if (i < recipients.length - 1) {
                await this.delay(500);
            }
        }
        
        // انتظار برای پردازش صف
        await this.delay(2000);
        
        App.showToast(`✅ پیامک به ${successCount} نفر از ${recipients.length} نفر ارسال شد`, 'success');
        
        if (callback) callback({ success: true, total: recipients.length, sent: successCount });
        
        return results;
    },
    
    // ===== پردازش صف =====
    processQueue: async function() {
        if (this.isProcessing || this.sendQueue.length === 0) return;
        
        this.isProcessing = true;
        
        while (this.sendQueue.length > 0) {
            const job = this.sendQueue.shift();
            await this.sendViaProvider(job);
        }
        
        this.isProcessing = false;
    },
    
    // ===== ارسال از طریق درگاه =====
    sendViaProvider: async function(job) {
        try {
            job.attempts++;
            
            // شبیه‌سازی ارسال به درگاه
            await this.delay(800);
            
            // در حالت واقعی، اینجا API درگاه فراخوانی می‌شود
            // مثلاً: await fetch(`https://api.kavenegar.com/v1/${this.config.apiKey}/sms/send.json`, {...})
            
            const success = Math.random() > 0.05; // 95% موفقیت
            
            if (success) {
                job.status = 'sent';
                job.sentAt = new Date().toISOString();
                
                console.log(`📱 پیامک به ${job.to} ارسال شد: ${job.message.substring(0, 50)}...`);
                
                // ذخیره در تاریخچه
                this.addToHistory(job);
                
                if (job.callback) job.callback({ success: true, job: job });
                
                // ارسال رویداد
                App.emit('sms:sent', job);
            } else {
                if (job.attempts < 3) {
                    // تلاش مجدد
                    job.status = 'pending';
                    this.sendQueue.unshift(job);
                    console.log(`🔄 تلاش مجدد برای ارسال پیامک به ${job.to} (تلاش ${job.attempts})`);
                } else {
                    job.status = 'failed';
                    console.error(`❌ ارسال پیامک به ${job.to} پس از 3 تلاش ناموفق بود`);
                    if (job.callback) job.callback({ success: false, error: 'ارسال ناموفق' });
                }
            }
            
            return success;
        } catch (error) {
            console.error('خطا در ارسال پیامک:', error);
            
            if (job.attempts < 3) {
                job.status = 'pending';
                this.sendQueue.unshift(job);
            } else {
                job.status = 'failed';
                if (job.callback) job.callback({ success: false, error: error.message });
            }
            
            return false;
        }
    },
    
    // ===== افزودن به تاریخچه =====
    addToHistory: function(sms) {
        this.history.unshift({
            id: sms.id,
            to: sms.to,
            message: sms.message,
            status: sms.status,
            sentAt: sms.sentAt,
            createdAt: sms.createdAt
        });
        
        if (this.history.length > 500) {
            this.history.pop();
        }
        
        this.saveHistory();
    },
    
    // ===== دریافت تاریخچه =====
    getHistory: function(limit = 50, filter = null) {
        let filtered = this.history;
        
        if (filter) {
            if (filter.to) {
                filtered = filtered.filter(h => h.to.includes(filter.to));
            }
            if (filter.status) {
                filtered = filtered.filter(h => h.status === filter.status);
            }
            if (filter.fromDate) {
                filtered = filtered.filter(h => new Date(h.createdAt) >= new Date(filter.fromDate));
            }
            if (filter.toDate) {
                filtered = filtered.filter(h => new Date(h.createdAt) <= new Date(filter.toDate));
            }
        }
        
        return filtered.slice(0, limit);
    },
    
    // ===== ارسال پیامک یادآور نوبت =====
    sendBookingReminder: async function(booking) {
        const date = new Date(booking.date).toLocaleDateString('fa-IR');
        
        const message = `⏰ یادآوری نوبت: فردا ساعت ${booking.time} در ${booking.business.name} - آدرس: ${booking.business.address}\n
لطفاً 15 دقیقه قبل از نوبت حضور داشته باشید.
کد رهگیری: ${booking.id}`;
        
        return await this.sendSMS({
            to: booking.customer.phone,
            message: message,
            template: 'booking_reminder',
            params: {
                business_name: booking.business.name,
                date: date,
                time: booking.time,
                address: booking.business.address,
                booking_id: booking.id
            }
        });
    },
    
    // ===== ارسال پیامک تأیید نوبت =====
    sendBookingConfirmation: async function(booking) {
        const date = new Date(booking.date).toLocaleDateString('fa-IR');
        
        const message = `✅ نوبت شما با موفقیت ثبت شد!
        
📅 تاریخ: ${date}
⏰ ساعت: ${booking.time}
🏢 کسب‌وکار: ${booking.business.name}
📍 آدرس: ${booking.business.address}
🔢 کد رهگیری: ${booking.id}

برای لغو نوبت به پنل کاربری مراجعه کنید.`;
        
        return await this.sendSMS({
            to: booking.customer.phone,
            message: message,
            template: 'booking_confirmation',
            params: {
                booking_id: booking.id,
                business_name: booking.business.name,
                date: date,
                time: booking.time,
                address: booking.business.address
            }
        });
    },
    
    // ===== ارسال پیامک لغو نوبت =====
    sendCancellationSMS: async function(booking) {
        const refundAmount = booking.refundAmount || 0;
        
        const message = `❌ نوبت شما در ${booking.business.name} لغو شد.
        
📅 تاریخ: ${new Date(booking.date).toLocaleDateString('fa-IR')}
⏰ ساعت: ${booking.time}

${refundAmount > 0 ? `💰 مبلغ ${refundAmount.toLocaleString('fa-IR')} تومان به حساب شما بازگشت داده شد.` : 'این لغو جریمه نداشت.'}`;
        
        return await this.sendSMS({
            to: booking.customer.phone,
            message: message,
            template: 'cancellation_notification',
            params: {
                business_name: booking.business.name,
                date: booking.date,
                time: booking.time,
                refund_amount: refundAmount
            }
        });
    },
    
    // ===== ارسال پیامک خوش‌آمدگویی =====
    sendWelcomeSMS: async function(user) {
        const message = `🎉 به پلتفرم نوبت‌دهی هوشمند خوش آمدید ${user.name}!

✨ 100 امتیاز به حساب شما اضافه شد.
🎁 کد تخفیف WELCOME10 برای اولین نوبت شما فعال است.

برای شروع رزرو به سایت مراجعه کنید.`;
        
        return await this.sendSMS({
            to: user.phone,
            message: message,
            template: 'welcome',
            params: {
                user_name: user.name,
                points: 100,
                coupon_code: 'WELCOME10'
            }
        });
    },
    
    // ===== آمار ارسال =====
    getStats: function() {
        const total = this.history.length;
        const sent = this.history.filter(h => h.status === 'sent').length;
        const failed = this.history.filter(h => h.status === 'failed').length;
        
        return {
            total: total,
            sent: sent,
            failed: failed,
            successRate: total > 0 ? (sent / total * 100).toFixed(1) : 0
        };
    },
    
    // ===== تغییر وضعیت سرویس =====
    setEnabled: function(enabled) {
        this.config.enabled = enabled;
        this.saveConfig();
        App.showToast(`سرویس پیامک ${enabled ? 'فعال' : 'غیرفعال'} شد`, 'info');
        App.emit('sms:status-changed', { enabled });
    },
    
    // ===== تنظیم درگاه =====
    setProvider: function(provider, apiKey, senderNumber) {
        this.config.provider = provider;
        if (apiKey) this.config.apiKey = apiKey;
        if (senderNumber) this.config.senderNumber = senderNumber;
        this.saveConfig();
        App.showToast(`درگاه پیامک به ${provider} تغییر یافت`, 'success');
    },
    
    // ===== پاک کردن تاریخچه =====
    clearHistory: function() {
        if (confirm('آیا از پاک کردن تمام تاریخچه پیامک‌ها مطمئن هستید؟')) {
            this.history = [];
            this.saveHistory();
            App.showToast('تاریخچه پیامک‌ها پاک شد', 'success');
        }
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// استایل‌های پنل پیامک (در صورت نیاز)
const smsStyles = `
<style>
.sms-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.sms-stats .stat-card {
    text-align: center;
    padding: 15px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: var(--radius-lg);
    color: white;
}

.sms-history-table {
    margin-top: 15px;
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
}

.sms-status {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.sms-status.sent {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.sms-status.failed {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.sms-status.pending {
    background: var(--color-warning-soft);
    color: var(--color-warning);
}
</style>
`;

if (!document.querySelector('#sms-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'sms-styles';
    styleSheet.textContent = smsStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    SMSSender.init();
});

window.SMSSender = SMSSender;
