 /* ============================================
   EMAIL-SENDER.JS - سرویس ارسال ایمیل
   ============================================ */

const EmailSender = {
    // تنظیمات
    config: {
        enabled: true,
        fromEmail: 'noreply@booking-platform.ir',
        fromName: 'پلتفرم نوبت‌دهی هوشمند',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        sandbox: true
    },
    
    // صف ارسال
    sendQueue: [],
    isProcessing: false,
    
    // تاریخچه
    history: [],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadConfig();
        this.loadHistory();
        this.attachEvents();
        console.log('📧 سرویس ایمیل راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: function() {
        const saved = localStorage.getItem('email_config');
        if (saved) {
            try {
                this.config = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره تنظیمات =====
    saveConfig: function() {
        localStorage.setItem('email_config', JSON.stringify(this.config));
    },
    
    // ===== بارگذاری تاریخچه =====
    loadHistory: function() {
        const saved = localStorage.getItem('email_history');
        if (saved) {
            try {
                this.history = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره تاریخچه =====
    saveHistory: function() {
        localStorage.setItem('email_history', JSON.stringify(this.history.slice(0, 500)));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('email:send', (data) => {
            this.sendEmail(data);
        });
        
        App.on(SystemEvents.BOOKING_CREATED, (booking) => {
            if (booking.customer.email) {
                this.sendBookingConfirmation(booking);
            }
        });
        
        App.on(SystemEvents.USER_REGISTERED, (user) => {
            if (user.email) {
                this.sendWelcomeEmail(user);
            }
        });
    },
    
    // ===== ارسال ایمیل =====
    sendEmail: async function(data) {
        const { to, subject, body, template, params, attachments, callback } = data;
        
        if (!this.config.enabled) {
            console.warn('سرویس ایمیل غیرفعال است');
            if (callback) callback({ success: false, error: 'سرویس غیرفعال است' });
            return false;
        }
        
        if (!to || !subject) {
            console.error('ایمیل گیرنده یا موضوع نامعتبر است');
            if (callback) callback({ success: false, error: 'اطلاعات ناقص' });
            return false;
        }
        
        let finalBody = body;
        
        // استفاده از قالب
        if (template && window.TemplateManager) {
            finalBody = window.TemplateManager.renderTemplate(template, params);
        }
        
        if (!finalBody) {
            console.error('متن ایمیل خالی است');
            return false;
        }
        
        // اعتبارسنجی ایمیل
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            console.error('ایمیل گیرنده نامعتبر است:', to);
            if (callback) callback({ success: false, error: 'ایمیل نامعتبر' });
            return false;
        }
        
        const emailJob = {
            id: 'EML' + Date.now() + Math.floor(Math.random() * 10000),
            to: to,
            subject: subject,
            body: finalBody,
            attachments: attachments || [],
            status: 'pending',
            attempts: 0,
            createdAt: new Date().toISOString(),
            callback: callback
        };
        
        this.sendQueue.push(emailJob);
        this.processQueue();
        
        return emailJob;
    },
    
    // ===== پردازش صف =====
    processQueue: async function() {
        if (this.isProcessing || this.sendQueue.length === 0) return;
        
        this.isProcessing = true;
        
        while (this.sendQueue.length > 0) {
            const job = this.sendQueue.shift();
            await this.sendViaSMTP(job);
        }
        
        this.isProcessing = false;
    },
    
    // ===== ارسال از طریق SMTP =====
    sendViaSMTP: async function(job) {
        try {
            job.attempts++;
            
            // شبیه‌سازی ارسال ایمیل
            await this.delay(1000);
            
            // در حالت واقعی، اینجا کتابخانه SMTP یا API ایمیل فراخوانی می‌شود
            // مثلاً: Email.send({ Host: this.config.smtpHost, ... })
            
            const success = Math.random() > 0.05; // 95% موفقیت
            
            if (success) {
                job.status = 'sent';
                job.sentAt = new Date().toISOString();
                
                console.log(`📧 ایمیل به ${job.to} ارسال شد: ${job.subject}`);
                
                // ذخیره در تاریخچه
                this.addToHistory(job);
                
                if (job.callback) job.callback({ success: true, job: job });
                
                // ارسال رویداد
                App.emit('email:sent', job);
            } else {
                if (job.attempts < 3) {
                    job.status = 'pending';
                    this.sendQueue.unshift(job);
                    console.log(`🔄 تلاش مجدد برای ارسال ایمیل به ${job.to} (تلاش ${job.attempts})`);
                } else {
                    job.status = 'failed';
                    console.error(`❌ ارسال ایمیل به ${job.to} پس از 3 تلاش ناموفق بود`);
                    if (job.callback) job.callback({ success: false, error: 'ارسال ناموفق' });
                }
            }
            
            return success;
        } catch (error) {
            console.error('خطا در ارسال ایمیل:', error);
            
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
    addToHistory: function(email) {
        this.history.unshift({
            id: email.id,
            to: email.to,
            subject: email.subject,
            status: email.status,
            sentAt: email.sentAt,
            createdAt: email.createdAt
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
        }
        
        return filtered.slice(0, limit);
    },
    
    // ===== ارسال ایمیل تأیید نوبت =====
    sendBookingConfirmation: async function(booking) {
        const date = new Date(booking.date).toLocaleDateString('fa-IR');
        
        const subject = `✅ تأیید نوبت - کد رهگیری: ${booking.id}`;
        
        const body = `
            <div style="font-family: Vazir, Tahoma; direction: rtl;">
                <h2 style="color: #3B82F6;">✅ تأیید نوبت</h2>
                <p>${booking.customer.name} عزیز،</p>
                <p>نوبت شما با موفقیت ثبت شد. جزئیات نوبت:</p>
                
                <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                    <tr style="background: #F3F4F6;">
                        <td style="padding: 10px; border: 1px solid #E5E7EB;">کد رهگیری</td>
                        <td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>${booking.id}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #E5E7EB;">کسب‌وکار</td>
                        <td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>${booking.business.name}</strong></td>
                    </tr>
                    <tr style="background: #F3F4F6;">
                        <td style="padding: 10px; border: 1px solid #E5E7EB;">تاریخ</td>
                        <td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>${date}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #E5E7EB;">ساعت</td>
                        <td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>${booking.time}</strong></td>
                    </tr>
                    <tr style="background: #F3F4F6;">
                        <td style="padding: 10px; border: 1px solid #E5E7EB;">خدمت</td>
                        <td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>${booking.service.name}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #E5E7EB;">آدرس</td>
                        <td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>${booking.business.address}</strong></td>
                    </tr>
                </table>
                
                <p>🔔 لطفاً 15 دقیقه قبل از نوبت در محل حاضر باشید.</p>
                <p>برای لغو نوبت، به پنل کاربری خود مراجعه کنید.</p>
                
                <hr style="margin: 30px 0;">
                <p style="color: #9CA3AF; font-size: 12px;">این ایمیل به صورت خودکار ارسال شده است. لطفاً به آن پاسخ ندهید.</p>
            </div>
        `;
        
        return await this.sendEmail({
            to: booking.customer.email,
            subject: subject,
            body: body,
            template: 'booking_confirmation_email',
            params: {
                booking_id: booking.id,
                customer_name: booking.customer.name,
                business_name: booking.business.name,
                date: date,
                time: booking.time,
                service_name: booking.service.name,
                address: booking.business.address
            }
        });
    },
    
    // ===== ارسال ایمیل خوش‌آمدگویی =====
    sendWelcomeEmail: async function(user) {
        const subject = `🎉 به پلتفرم نوبت‌دهی هوشمند خوش آمدید!`;
        
        const body = `
            <div style="font-family: Vazir, Tahoma; direction: rtl;">
                <h2 style="color: #3B82F6;">🎉 خوش آمدید!</h2>
                <p>${user.name} عزیز،</p>
                <p>به پلتفرم نوبت‌دهی هوشمند خوش آمدید.</p>
                
                <div style="background: #EFF6FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #3B82F6;">✨ مزایای عضویت:</h3>
                    <ul>
                        <li>🎁 100 امتیاز هدیه</li>
                        <li>💎 کد تخفیف WELCOME10 برای اولین نوبت</li>
                        <li>⭐ برنامه وفاداری با تخفیف تا 30%</li>
                        <li>📱 رزرو آسان و سریع</li>
                    </ul>
                </div>
                
                <p>برای شروع، همین حالا اولین نوبت خود را رزرو کنید!</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">شروع رزرو</a>
                </div>
                
                <hr style="margin: 30px 0;">
                <p style="color: #9CA3AF; font-size: 12px;">این ایمیل به صورت خودکار ارسال شده است.</p>
            </div>
        `;
        
        return await this.sendEmail({
            to: user.email,
            subject: subject,
            body: body,
            template: 'welcome_email',
            params: {
                user_name: user.name,
                points: 100,
                coupon_code: 'WELCOME10'
            }
        });
    },
    
    // ===== ارسال ایمیل یادآور نوبت =====
    sendReminderEmail: async function(booking) {
        const date = new Date(booking.date).toLocaleDateString('fa-IR');
        
        const subject = `⏰ یادآوری نوبت - فردا ساعت ${booking.time}`;
        
        const body = `
            <div style="font-family: Vazir, Tahoma; direction: rtl;">
                <h2 style="color: #F59E0B;">⏰ یادآوری نوبت</h2>
                <p>${booking.customer.name} عزیز،</p>
                <p>این یک یادآوری برای نوبت فردا شما است:</p>
                
                <div style="background: #FFFBEB; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>📅 تاریخ:</strong> ${date}</p>
                    <p><strong>⏰ ساعت:</strong> ${booking.time}</p>
                    <p><strong>🏢 کسب‌وکار:</strong> ${booking.business.name}</p>
                    <p><strong>📍 آدرس:</strong> ${booking.business.address}</p>
                    <p><strong>📞 تلفن:</strong> ${booking.business.phone}</p>
                </div>
                
                <p>🔔 لطفاً 15 دقیقه قبل از نوبت در محل حاضر باشید.</p>
                <p>در صورت نیاز به تغییر یا لغو نوبت، به پنل کاربری خود مراجعه کنید.</p>
                
                <hr style="margin: 30px 0;">
                <p style="color: #9CA3AF; font-size: 12px;">این ایمیل به صورت خودکار ارسال شده است.</p>
            </div>
        `;
        
        return await this.sendEmail({
            to: booking.customer.email,
            subject: subject,
            body: body,
            template: 'reminder_email',
            params: {
                customer_name: booking.customer.name,
                date: date,
                time: booking.time,
                business_name: booking.business.name,
                address: booking.business.address,
                phone: booking.business.phone
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
        App.showToast(`سرویس ایمیل ${enabled ? 'فعال' : 'غیرفعال'} شد`, 'info');
        App.emit('email:status-changed', { enabled });
    },
    
    // ===== تنظیم SMTP =====
    setSMTPConfig: function(host, port, user, pass, fromEmail, fromName) {
        this.config.smtpHost = host;
        this.config.smtpPort = port;
        this.config.smtpUser = user;
        this.config.smtpPass = pass;
        if (fromEmail) this.config.fromEmail = fromEmail;
        if (fromName) this.config.fromName = fromName;
        this.saveConfig();
        App.showToast('تنظیمات SMTP ذخیره شد', 'success');
    },
    
    // ===== پاک کردن تاریخچه =====
    clearHistory: function() {
        if (confirm('آیا از پاک کردن تمام تاریخچه ایمیل‌ها مطمئن هستید؟')) {
            this.history = [];
            this.saveHistory();
            App.showToast('تاریخچه ایمیل‌ها پاک شد', 'success');
        }
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// استایل‌های پنل ایمیل
const emailStyles = `
<style>
.email-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.email-stats .stat-card {
    text-align: center;
    padding: 15px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: var(--radius-lg);
    color: white;
}

.email-config-form {
    max-width: 500px;
    margin-bottom: 20px;
}

.smtp-config {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin: 20px 0;
}

.email-status {
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
}

.email-status.sent {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.email-status.failed {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}
</style>
`;

if (!document.querySelector('#email-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'email-styles';
    styleSheet.textContent = emailStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    EmailSender.init();
});

window.EmailSender = EmailSender;
