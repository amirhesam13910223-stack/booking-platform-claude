 /* ============================================
   SYSTEM-SETTINGS.JS - تنظیمات سیستم
   ============================================ */

const SystemSettings = {
    // تنظیمات سیستم
    settings: {
        general: {
            siteName: 'پلتفرم نوبت‌دهی هوشمند',
            siteDescription: 'ساده‌ترین راه برای رزرو نوبت',
            contactEmail: 'info@booking-platform.ir',
            contactPhone: '021-12345678',
            timezone: 'Asia/Tehran',
            language: 'fa'
        },
        booking: {
            minAdvanceHours: 1,
            maxAdvanceDays: 30,
            cancellationFee: 25,
            depositRequired: true,
            depositPercent: 10
        },
        payment: {
            defaultGateway: 'zarinpal',
            commissionRate: 3,
            minWithdraw: 50000,
            maxWithdraw: 10000000
        },
        notification: {
            smsEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
            reminderHours: [24, 2]
        },
        security: {
            mfaRequired: false,
            sessionTimeout: 7200,
            maxLoginAttempts: 5,
            passwordMinLength: 6
        },
        features: {
            reverseMarket: true,
            groupBooking: true,
            loyaltyProgram: true,
            referralProgram: true
        }
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadSettings();
        this.attachEvents();
        console.log('⚙️ ماژول تنظیمات سیستم راه‌اندازی شد');
    },
    
    // ===== بارگذاری تنظیمات =====
    loadSettings: function() {
        const saved = localStorage.getItem('system_settings');
        if (saved) {
            try {
                this.settings = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره تنظیمات =====
    saveSettings: function() {
        localStorage.setItem('system_settings', JSON.stringify(this.settings));
        this.applySettings();
    },
    
    // ===== اعمال تنظیمات =====
    applySettings: function() {
        // اعمال در سراسر سیستم
        document.title = this.settings.general.siteName;
        
        // تنظیم زبان
        document.documentElement.lang = this.settings.general.language;
        
        App.emit('settings:applied', this.settings);
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('settings:update', (data) => {
            this.updateSettings(data);
        });
    },
    
    // ===== به‌روزرسانی تنظیمات =====
    updateSettings: function(data) {
        const { category, key, value } = data;
        
        if (this.settings[category] && this.settings[category][key] !== undefined) {
            this.settings[category][key] = value;
            this.saveSettings();
            App.showToast('تنظیمات با موفقیت ذخیره شد', 'success');
            return true;
        }
        return false;
    },
    
    // ===== نمایش مودال تنظیمات =====
    showSettingsModal: function() {
        const modal = document.createElement('div');
        modal.id = 'systemSettingsModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>⚙️ تنظیمات سیستم</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-tabs">
                        <button class="tab-btn active" data-tab="general">عمومی</button>
                        <button class="tab-btn" data-tab="booking">نوبت‌دهی</button>
                        <button class="tab-btn" data-tab="payment">پرداخت</button>
                        <button class="tab-btn" data-tab="notification">اعلانات</button>
                        <button class="tab-btn" data-tab="security">امنیت</button>
                        <button class="tab-btn" data-tab="features">ویژگی‌ها</button>
                    </div>
                    
                    <div id="generalTab" class="tab-content active">
                        <div class="settings-form">
                            <div class="form-group">
                                <label>نام سایت</label>
                                <input type="text" id="siteName" class="form-control" value="${this.settings.general.siteName}">
                            </div>
                            <div class="form-group">
                                <label>توضیحات سایت</label>
                                <textarea id="siteDescription" class="form-control" rows="2">${this.settings.general.siteDescription}</textarea>
                            </div>
                            <div class="form-group">
                                <label>ایمیل تماس</label>
                                <input type="email" id="contactEmail" class="form-control" value="${this.settings.general.contactEmail}">
                            </div>
                            <div class="form-group">
                                <label>شماره تماس</label>
                                <input type="tel" id="contactPhone" class="form-control" value="${this.settings.general.contactPhone}">
                            </div>
                            <div class="form-group">
                                <label>منطقه زمانی</label>
                                <select id="timezone" class="form-control">
                                    <option value="Asia/Tehran" ${this.settings.general.timezone === 'Asia/Tehran' ? 'selected' : ''}>ایران</option>
                                    <option value="UTC" ${this.settings.general.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div id="bookingTab" class="tab-content">
                        <div class="settings-form">
                            <div class="form-group">
                                <label>حداقل ساعت قبل از رزرو</label>
                                <input type="number" id="minAdvanceHours" class="form-control" value="${this.settings.booking.minAdvanceHours}">
                            </div>
                            <div class="form-group">
                                <label>حداکثر روز قبل از رزرو</label>
                                <input type="number" id="maxAdvanceDays" class="form-control" value="${this.settings.booking.maxAdvanceDays}">
                            </div>
                            <div class="form-group">
                                <label>جریمه کنسلی (%)</label>
                                <input type="number" id="cancellationFee" class="form-control" value="${this.settings.booking.cancellationFee}">
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="depositRequired" ${this.settings.booking.depositRequired ? 'checked' : ''}> نیاز به بیعانه
                                </label>
                            </div>
                            <div class="form-group">
                                <label>درصد بیعانه</label>
                                <input type="number" id="depositPercent" class="form-control" value="${this.settings.booking.depositPercent}">
                            </div>
                        </div>
                    </div>
                    
                    <div id="paymentTab" class="tab-content">
                        <div class="settings-form">
                            <div class="form-group">
                                <label>درگاه پیش‌فرض</label>
                                <select id="defaultGateway" class="form-control">
                                    <option value="zarinpal" ${this.settings.payment.defaultGateway === 'zarinpal' ? 'selected' : ''}>زرین‌پال</option>
                                    <option value="idpay" ${this.settings.payment.defaultGateway === 'idpay' ? 'selected' : ''}>آیدی‌پی</option>
                                    <option value="nextpay" ${this.settings.payment.defaultGateway === 'nextpay' ? 'selected' : ''}>نکست‌پی</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>کارمزد پلتفرم (%)</label>
                                <input type="number" id="commissionRate" class="form-control" value="${this.settings.payment.commissionRate}" step="0.5">
                            </div>
                            <div class="form-group">
                                <label>حداقل مبلغ برداشت</label>
                                <input type="number" id="minWithdraw" class="form-control" value="${this.settings.payment.minWithdraw}">
                            </div>
                            <div class="form-group">
                                <label>حداکثر مبلغ برداشت</label>
                                <input type="number" id="maxWithdraw" class="form-control" value="${this.settings.payment.maxWithdraw}">
                            </div>
                        </div>
                    </div>
                    
                    <div id="notificationTab" class="tab-content">
                        <div class="settings-form">
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="smsEnabled" ${this.settings.notification.smsEnabled ? 'checked' : ''}> ارسال پیامک
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="emailEnabled" ${this.settings.notification.emailEnabled ? 'checked' : ''}> ارسال ایمیل
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="pushEnabled" ${this.settings.notification.pushEnabled ? 'checked' : ''}> نوتیفیکیشن
                                </label>
                            </div>
                            <div class="form-group">
                                <label>یادآور (ساعت قبل از نوبت)</label>
                                <div class="reminder-inputs">
                                    <input type="number" id="reminder1" class="form-control" value="${this.settings.notification.reminderHours[0] || 24}">
                                    <span>و</span>
                                    <input type="number" id="reminder2" class="form-control" value="${this.settings.notification.reminderHours[1] || 2}">
                                    <span>ساعت قبل</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="securityTab" class="tab-content">
                        <div class="settings-form">
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="mfaRequired" ${this.settings.security.mfaRequired ? 'checked' : ''}> احراز هویت دو مرحله‌ای اجباری
                                </label>
                            </div>
                            <div class="form-group">
                                <label>زمان انقضای نشست (ثانیه)</label>
                                <input type="number" id="sessionTimeout" class="form-control" value="${this.settings.security.sessionTimeout}">
                            </div>
                            <div class="form-group">
                                <label>حداکثر تلاش برای ورود</label>
                                <input type="number" id="maxLoginAttempts" class="form-control" value="${this.settings.security.maxLoginAttempts}">
                            </div>
                            <div class="form-group">
                                <label>حداقل طول رمز عبور</label>
                                <input type="number" id="passwordMinLength" class="form-control" value="${this.settings.security.passwordMinLength}">
                            </div>
                        </div>
                    </div>
                    
                    <div id="featuresTab" class="tab-content">
                        <div class="settings-form">
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="reverseMarketEnabled" ${this.settings.features.reverseMarket ? 'checked' : ''}> بازار معکوس
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="groupBookingEnabled" ${this.settings.features.groupBooking ? 'checked' : ''}> رزرو گروهی
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="loyaltyProgramEnabled" ${this.settings.features.loyaltyProgram ? 'checked' : ''}> برنامه وفاداری
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="referralProgramEnabled" ${this.settings.features.referralProgram ? 'checked' : ''}> برنامه معرفی
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-actions">
                        <button class="btn btn-primary" id="saveAllSettingsBtn">ذخیره همه تنظیمات</button>
                        <button class="btn btn-outline" id="resetSettingsBtn">بازنشانی به پیش‌فرض</button>
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
        
        // ذخیره همه تنظیمات
        document.getElementById('saveAllSettingsBtn')?.addEventListener('click', () => {
            this.saveAllSettingsFromForm();
            App.showToast('تمامی تنظیمات با موفقیت ذخیره شد', 'success');
        });
        
        // بازنشانی به پیش‌فرض
        document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
            if (confirm('آیا از بازنشانی تمام تنظیمات به حالت پیش‌فرض مطمئن هستید؟')) {
                this.resetToDefault();
                modal.remove();
                setTimeout(() => this.showSettingsModal(), 100);
            }
        });
    },
    
    // ===== ذخیره همه تنظیمات از فرم =====
    saveAllSettingsFromForm: function() {
        // عمومی
        this.settings.general.siteName = document.getElementById('siteName')?.value || this.settings.general.siteName;
        this.settings.general.siteDescription = document.getElementById('siteDescription')?.value || this.settings.general.siteDescription;
        this.settings.general.contactEmail = document.getElementById('contactEmail')?.value || this.settings.general.contactEmail;
        this.settings.general.contactPhone = document.getElementById('contactPhone')?.value || this.settings.general.contactPhone;
        this.settings.general.timezone = document.getElementById('timezone')?.value || this.settings.general.timezone;
        
        // نوبت‌دهی
        this.settings.booking.minAdvanceHours = parseInt(document.getElementById('minAdvanceHours')?.value) || this.settings.booking.minAdvanceHours;
        this.settings.booking.maxAdvanceDays = parseInt(document.getElementById('maxAdvanceDays')?.value) || this.settings.booking.maxAdvanceDays;
        this.settings.booking.cancellationFee = parseInt(document.getElementById('cancellationFee')?.value) || this.settings.booking.cancellationFee;
        this.settings.booking.depositRequired = document.getElementById('depositRequired')?.checked || false;
        this.settings.booking.depositPercent = parseInt(document.getElementById('depositPercent')?.value) || this.settings.booking.depositPercent;
        
        // پرداخت
        this.settings.payment.defaultGateway = document.getElementById('defaultGateway')?.value || this.settings.payment.defaultGateway;
        this.settings.payment.commissionRate = parseFloat(document.getElementById('commissionRate')?.value) || this.settings.payment.commissionRate;
        this.settings.payment.minWithdraw = parseInt(document.getElementById('minWithdraw')?.value) || this.settings.payment.minWithdraw;
        this.settings.payment.maxWithdraw = parseInt(document.getElementById('maxWithdraw')?.value) || this.settings.payment.maxWithdraw;
        
        // اعلانات
        this.settings.notification.smsEnabled = document.getElementById('smsEnabled')?.checked || false;
        this.settings.notification.emailEnabled = document.getElementById('emailEnabled')?.checked || false;
        this.settings.notification.pushEnabled = document.getElementById('pushEnabled')?.checked || false;
        this.settings.notification.reminderHours = [
            parseInt(document.getElementById('reminder1')?.value) || 24,
            parseInt(document.getElementById('reminder2')?.value) || 2
        ];
        
        // امنیت
        this.settings.security.mfaRequired = document.getElementById('mfaRequired')?.checked || false;
        this.settings.security.sessionTimeout = parseInt(document.getElementById('sessionTimeout')?.value) || this.settings.security.sessionTimeout;
        this.settings.security.maxLoginAttempts = parseInt(document.getElementById('maxLoginAttempts')?.value) || this.settings.security.maxLoginAttempts;
        this.settings.security.passwordMinLength = parseInt(document.getElementById('passwordMinLength')?.value) || this.settings.security.passwordMinLength;
        
        // ویژگی‌ها
        this.settings.features.reverseMarket = document.getElementById('reverseMarketEnabled')?.checked || false;
        this.settings.features.groupBooking = document.getElementById('groupBookingEnabled')?.checked || false;
        this.settings.features.loyaltyProgram = document.getElementById('loyaltyProgramEnabled')?.checked || false;
        this.settings.features.referralProgram = document.getElementById('referralProgramEnabled')?.checked || false;
        
        this.saveSettings();
    },
    
    // ===== بازنشانی به پیش‌فرض =====
    resetToDefault: function() {
        this.settings = {
            general: {
                siteName: 'پلتفرم نوبت‌دهی هوشمند',
                siteDescription: 'ساده‌ترین راه برای رزرو نوبت',
                contactEmail: 'info@booking-platform.ir',
                contactPhone: '021-12345678',
                timezone: 'Asia/Tehran',
                language: 'fa'
            },
            booking: {
                minAdvanceHours: 1,
                maxAdvanceDays: 30,
                cancellationFee: 25,
                depositRequired: true,
                depositPercent: 10
            },
            payment: {
                defaultGateway: 'zarinpal',
                commissionRate: 3,
                minWithdraw: 50000,
                maxWithdraw: 10000000
            },
            notification: {
                smsEnabled: true,
                emailEnabled: true,
                pushEnabled: true,
                reminderHours: [24, 2]
            },
            security: {
                mfaRequired: false,
                sessionTimeout: 7200,
                maxLoginAttempts: 5,
                passwordMinLength: 6
            },
            features: {
                reverseMarket: true,
                groupBooking: true,
                loyaltyProgram: true,
                referralProgram: true
            }
        };
        this.saveSettings();
        App.showToast('تنظیمات به حالت پیش‌فرض بازنشانی شد', 'success');
    }
};

// استایل‌های تنظیمات سیستم
const systemSettingsStyles = `
<style>
.settings-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
    flex-wrap: wrap;
}

.settings-form {
    max-width: 500px;
}

.reminder-inputs {
    display: flex;
    align-items: center;
    gap: 10px;
}

.reminder-inputs input {
    width: 80px;
}

.settings-actions {
    display: flex;
    gap: 15px;
    margin: 20px 0;
    justify-content: center;
}
</style>
`;

if (!document.querySelector('#system-settings-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'system-settings-styles';
    styleSheet.textContent = systemSettingsStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    SystemSettings.init();
});

window.SystemSettings = SystemSettings;
