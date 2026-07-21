 /* ============================================
   REMINDER-SCHEDULER.JS - زمانبندی یادآورها
   ============================================ */

const ReminderScheduler = {
    // زمانبندی‌های فعال
    schedules: [],
    
    // تایمرها
    timers: [],
    
    // تنظیمات
    config: {
        enabled: true,
        reminderTimes: [24, 2], // ساعت قبل از نوبت
        checkInterval: 60000, // هر 1 دقیقه
        maxReminders: 3
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadConfig();
        this.loadSchedules();
        this.startChecker();
        this.attachEvents();
        console.log('⏰ سرویس زمانبندی یادآورها راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadConfig: function() {
        const saved = localStorage.getItem('reminder_config');
        if (saved) {
            try {
                this.config = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره تنظیمات =====
    saveConfig: function() {
        localStorage.setItem('reminder_config', JSON.stringify(this.config));
    },
    
    // ===== بارگذاری زمانبندی‌ها =====
    loadSchedules: function() {
        const saved = localStorage.getItem('reminder_schedules');
        if (saved) {
            try {
                this.schedules = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره زمانبندی‌ها =====
    saveSchedules: function() {
        localStorage.setItem('reminder_schedules', JSON.stringify(this.schedules));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on(SystemEvents.BOOKING_CREATED, (booking) => {
            this.scheduleReminders(booking);
        });
        
        App.on(SystemEvents.BOOKING_CANCELLED, (booking) => {
            this.cancelReminders(booking.id);
        });
        
        App.on('reminder:schedule', (data) => {
            this.scheduleCustomReminder(data);
        });
    },
    
    // ===== شروع بررسی =====
    startChecker: function() {
        setInterval(() => {
            if (this.config.enabled) {
                this.checkReminders();
            }
        }, this.config.checkInterval);
    },
    
    // ===== بررسی یادآورها =====
    checkReminders: function() {
        const now = new Date();
        
        this.schedules.forEach(schedule => {
            if (schedule.status !== 'pending') return;
            
            const reminderTime = new Date(schedule.reminderTime);
            
            if (reminderTime <= now) {
                this.triggerReminder(schedule);
                schedule.status = 'sent';
                schedule.sentAt = new Date().toISOString();
            }
        });
        
        this.saveSchedules();
    },
    
    // ===== زمانبندی یادآورها برای نوبت =====
    scheduleReminders: function(booking) {
        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
        
        // حذف زمانبندی‌های قبلی برای این نوبت
        this.cancelReminders(booking.id);
        
        for (const hoursBefore of this.config.reminderTimes) {
            const reminderTime = new Date(bookingDateTime.getTime() - hoursBefore * 60 * 60 * 1000);
            
            // فقط زمان‌های آینده را زمانبندی کن
            if (reminderTime > new Date()) {
                const schedule = {
                    id: `REM_${booking.id}_${hoursBefore}`,
                    bookingId: booking.id,
                    booking: booking,
                    reminderTime: reminderTime.toISOString(),
                    hoursBefore: hoursBefore,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                };
                
                this.schedules.push(schedule);
            }
        }
        
        this.saveSchedules();
        console.log(`⏰ ${this.config.reminderTimes.length} یادآور برای نوبت ${booking.id} زمانبندی شد`);
    },
    
    // ===== زمانبندی یادآور سفارشی =====
    scheduleCustomReminder: function(data) {
        const { bookingId, reminderTime, message, type } = data;
        
        const schedule = {
            id: `CUSTOM_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            bookingId: bookingId,
            reminderTime: reminderTime,
            message: message,
            type: type || 'custom',
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        this.schedules.push(schedule);
        this.saveSchedules();
        
        App.showToast('یادآور با موفقیت زمانبندی شد', 'success');
        return schedule;
    },
    
    // ===== لغو زمانبندی‌های یک نوبت =====
    cancelReminders: function(bookingId) {
        const initialLength = this.schedules.length;
        this.schedules = this.schedules.filter(s => s.bookingId !== bookingId);
        
        if (initialLength !== this.schedules.length) {
            this.saveSchedules();
            console.log(`⏰ یادآورهای نوبت ${bookingId} لغو شدند`);
        }
    },
    
    // ===== اجرای یادآور =====
    triggerReminder: function(schedule) {
        const { booking, hoursBefore, message, type } = schedule;
        
        console.log(`🔔 اجرای یادآور: ${hoursBefore} ساعت قبل از نوبت ${booking?.id || 'نامشخص'}`);
        
        // ارسال نوتیفیکیشن درون برنامه‌ای
        if (window.InAppAlert) {
            if (hoursBefore === 24) {
                window.InAppAlert.reminderAlert(booking);
            } else if (hoursBefore === 2) {
                window.InAppAlert.warning(
                    `نوبت شما در ${booking.business.name} حدود 2 ساعت دیگر است`,
                    '⏰ یادآوری فوری'
                );
            } else if (message) {
                window.InAppAlert.info(message, 'یادآور');
            }
        }
        
        // ارسال نوتیفیکیشن مرورگر
        if (window.PushNotification && window.PushNotification.isSubscribed) {
            const title = hoursBefore === 24 ? '⏰ یادآوری نوبت فردا' : '⏰ یادآوری نوبت';
            const body = hoursBefore === 24 
                ? `فردا ساعت ${booking.time} نوبت در ${booking.business.name} دارید`
                : `نوبت شما در ${booking.business.name} حدود 2 ساعت دیگر است`;
            
            window.PushNotification.sendNotification(title, { body });
        }
        
        // ارسال پیامک (در صورت فعال بودن و وجود شماره)
        if (window.SMSSender && booking?.customer?.phone) {
            if (hoursBefore === 24) {
                window.SMSSender.sendBookingReminder(booking);
            } else if (hoursBefore === 2) {
                window.SMSSender.sendSMS({
                    to: booking.customer.phone,
                    message: `⏰ یادآوری فوری: نوبت شما در ${booking.business.name} حدود 2 ساعت دیگر است. لطفاً آماده باشید.`
                });
            }
        }
        
        // ارسال ایمیل (در صورت فعال بودن و وجود ایمیل)
        if (window.EmailSender && booking?.customer?.email && hoursBefore === 24) {
            window.EmailSender.sendReminderEmail(booking);
        }
        
        // ارسال رویداد
        App.emit('reminder:triggered', schedule);
    },
    
    // ===== دریافت زمانبندی‌های فعال =====
    getActiveSchedules: function(bookingId = null) {
        let schedules = this.schedules.filter(s => s.status === 'pending');
        
        if (bookingId) {
            schedules = schedules.filter(s => s.bookingId === bookingId);
        }
        
        return schedules;
    },
    
    // ===== دریافت تاریخچه یادآورها =====
    getReminderHistory: function(limit = 50) {
        const sent = this.schedules.filter(s => s.status === 'sent');
        return sent.slice(0, limit);
    },
    
    // ===== تغییر وضعیت سرویس =====
    setEnabled: function(enabled) {
        this.config.enabled = enabled;
        this.saveConfig();
        App.showToast(`سرویس یادآور ${enabled ? 'فعال' : 'غیرفعال'} شد`, 'info');
    },
    
    // ===== تنظیم زمان‌های یادآور =====
    setReminderTimes: function(times) {
        this.config.reminderTimes = times;
        this.saveConfig();
        App.showToast(`زمان‌های یادآور تنظیم شد: ${times.join(', ')} ساعت قبل`, 'success');
    },
    
    // ===== نمایش پنل مدیریت یادآورها =====
    showReminderPanel: function() {
        const activeSchedules = this.getActiveSchedules();
        
        const modal = document.createElement('div');
        modal.id = 'reminderPanel';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>⏰ مدیریت یادآورها</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="reminder-stats">
                        <div class="stat-card">
                            <div class="stat-value">${activeSchedules.length}</div>
                            <div class="stat-label">یادآور فعال</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.config.reminderTimes.join(', ')}</div>
                            <div class="stat-label">زمان‌های یادآور (ساعت قبل)</div>
                        </div>
                    </div>
                    
                    <div class="reminder-settings">
                        <h4>تنظیمات</h4>
                        <div class="form-group">
                            <label>زمان‌های یادآور (ساعت قبل از نوبت)</label>
                            <div class="reminder-times-input">
                                <input type="number" id="reminderTime1" class="form-control" value="${this.config.reminderTimes[0] || 24}" min="1">
                                <span>و</span>
                                <input type="number" id="reminderTime2" class="form-control" value="${this.config.reminderTimes[1] || 2}" min="1">
                            </div>
                        </div>
                        <button class="btn btn-primary" id="updateReminderTimes">به‌روزرسانی زمان‌ها</button>
                    </div>
                    
                    <div class="active-reminders">
                        <h4>یادآورهای فعال</h4>
                        <div class="reminders-list">
                            ${activeSchedules.length === 0 ? 
                                '<div class="empty-state">هیچ یادآور فعالی وجود ندارد</div>' :
                                activeSchedules.map(s => `
                                    <div class="reminder-item">
                                        <div class="reminder-info">
                                            <strong>نوبت: ${s.booking?.business?.name || s.bookingId}</strong>
                                            <span>${new Date(s.reminderTime).toLocaleDateString('fa-IR')} - ${new Date(s.reminderTime).toLocaleTimeString('fa-IR')}</span>
                                            <span class="hours-badge">${s.hoursBefore || '?'} ساعت قبل</span>
                                        </div>
                                        <button class="icon-btn cancel-reminder" data-id="${s.id}">🗑️</button>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.getElementById('updateReminderTimes')?.addEventListener('click', () => {
            const time1 = parseInt(document.getElementById('reminderTime1')?.value) || 24;
            const time2 = parseInt(document.getElementById('reminderTime2')?.value) || 2;
            this.setReminderTimes([time1, time2]);
            modal.remove();
            setTimeout(() => this.showReminderPanel(), 100);
        });
        
        document.querySelectorAll('.cancel-reminder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const index = this.schedules.findIndex(s => s.id === id);
                if (index !== -1) {
                    this.schedules.splice(index, 1);
                    this.saveSchedules();
                    modal.remove();
                    setTimeout(() => this.showReminderPanel(), 100);
                    App.showToast('یادآور حذف شد', 'success');
                }
            });
        });
    }
};

// استایل‌های زمانبندی یادآورها
const reminderStyles = `
<style>
.reminder-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 25px;
}

.reminder-stats .stat-card {
    text-align: center;
    padding: 15px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: var(--radius-lg);
    color: white;
}

.reminder-settings {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 25px;
}

.reminder-times-input {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
}

.reminder-times-input input {
    width: 100px;
}

.reminders-list {
    max-height: 300px;
    overflow-y: auto;
    margin-top: 15px;
}

.reminder-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    margin-bottom: 10px;
}

.reminder-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.hours-badge {
    display: inline-block;
    background: var(--color-primary-soft);
    color: var(--color-primary);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
    width: fit-content;
}
</style>
`;

if (!document.querySelector('#reminder-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'reminder-styles';
    styleSheet.textContent = reminderStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    ReminderScheduler.init();
});

window.ReminderScheduler = ReminderScheduler;
