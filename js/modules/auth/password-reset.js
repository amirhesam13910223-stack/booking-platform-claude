 /* ============================================
   PASSWORD-RESET.JS - بازیابی رمز عبور
   ============================================ */

const AuthPasswordReset = {
    // وضعیت
    currentStep: 1, // 1: درخواست, 2: کد تأیید, 3: رمز جدید
    resetToken: null,
    resetPhone: null,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        // گوش دادن به لینک فراموشی رمز
        const forgotLink = document.getElementById('forgotPasswordLink');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showResetModal();
            });
        }
        
        console.log('🔑 ماژول PasswordReset راه‌اندازی شد');
    },
    
    // ===== نمایش مودال بازیابی رمز =====
    showResetModal: function() {
        this.currentStep = 1;
        
        const modal = document.createElement('div');
        modal.id = 'passwordResetModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔑 بازیابی رمز عبور</h3>
                    <button class="modal-close" onclick="AuthPasswordReset.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="resetStep1" class="reset-step">
                        <p>شماره تماس خود را وارد کنید. کد تأیید برای شما ارسال می‌شود.</p>
                        <div class="form-group">
                            <label>شماره تماس</label>
                            <input type="tel" id="resetPhone" class="form-control" placeholder="۰۹۱۲۱۲۳۴۵۶۷">
                        </div>
                        <button class="btn btn-primary btn-block" onclick="AuthPasswordReset.requestCode()">ارسال کد تأیید</button>
                    </div>
                    
                    <div id="resetStep2" class="reset-step" style="display: none;">
                        <p>کد تأیید ارسال شده را وارد کنید.</p>
                        <div class="form-group">
                            <label>کد تأیید</label>
                            <input type="text" id="resetCode" class="form-control" placeholder="_ _ _ _ _ _" maxlength="6">
                        </div>
                        <div class="reset-timer" style="text-align: center; margin: 10px 0;">
                            <span id="resetTimer">02:00</span>
                        </div>
                        <button class="btn btn-primary btn-block" onclick="AuthPasswordReset.verifyCode()">تأیید کد</button>
                        <button class="btn btn-outline btn-block" onclick="AuthPasswordReset.resendCode()">ارسال مجدد</button>
                    </div>
                    
                    <div id="resetStep3" class="reset-step" style="display: none;">
                        <p>رمز عبور جدید خود را وارد کنید.</p>
                        <div class="form-group">
                            <label>رمز عبور جدید</label>
                            <input type="password" id="newPassword" class="form-control" placeholder="حداقل ۶ کاراکتر">
                        </div>
                        <div class="form-group">
                            <label>تکرار رمز عبور</label>
                            <input type="password" id="confirmPassword" class="form-control" placeholder="تکرار رمز عبور">
                        </div>
                        <button class="btn btn-primary btn-block" onclick="AuthPasswordReset.resetPassword()">تغییر رمز عبور</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    },
    
    // ===== درخواست کد =====
    requestCode: async function() {
        const phone = document.getElementById('resetPhone')?.value.trim();
        
        if (!phone) {
            App.showToast('لطفاً شماره تماس را وارد کنید', 'warning');
            return;
        }
        
        const phoneRegex = /^09[0-9]{9}$/;
        if (!phoneRegex.test(phone)) {
            App.showToast('شماره تماس معتبر نیست', 'error');
            return;
        }
        
        App.showToast('در حال ارسال کد...', 'info');
        
        // شبیه‌سازی درخواست
        await this.delay(1000);
        
        // بررسی وجود کاربر (شبیه‌سازی)
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const userExists = registeredUsers.some(u => u.phone === phone);
        
        if (!userExists) {
            App.showToast('این شماره تماس در سیستم ثبت نشده است', 'error');
            return;
        }
        
        // ذخیره شماره تماس
        this.resetPhone = phone;
        this.resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        // ارسال کد (شبیه‌سازی)
        console.log(`📱 کد بازیابی به ${phone} ارسال شد: ${this.resetToken}`);
        
        App.showToast('کد تأیید ارسال شد', 'success');
        
        // رفتن به مرحله ۲
        this.goToStep(2);
        this.startResetTimer();
    },
    
    // ===== تأیید کد =====
    verifyCode: function() {
        const code = document.getElementById('resetCode')?.value.trim();
        
        if (!code || code.length !== 6) {
            App.showToast('لطفاً کد ۶ رقمی را وارد کنید', 'warning');
            return;
        }
        
        if (code === this.resetToken) {
            App.showToast('کد تأیید شد', 'success');
            this.goToStep(3);
        } else {
            App.showToast('کد تأیید اشتباه است', 'error');
        }
    },
    
    // ===== تغییر رمز عبور =====
    resetPassword: async function() {
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (!newPassword || newPassword.length < 6) {
            App.showToast('رمز عبور باید حداقل ۶ کاراکتر باشد', 'warning');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            App.showToast('رمز عبور و تکرار آن مطابقت ندارند', 'error');
            return;
        }
        
        App.showToast('در حال تغییر رمز عبور...', 'info');
        
        await this.delay(1000);
        
        // ذخیره رمز جدید (شبیه‌سازی)
        console.log(`🔑 رمز عبور برای شماره ${this.resetPhone} تغییر کرد`);
        
        App.showToast('✅ رمز عبور با موفقیت تغییر کرد', 'success');
        
        // بستن مودال
        this.closeModal();
        
        // باز کردن مودال ورود
        setTimeout(() => {
            App.openModal('loginModal');
        }, 500);
    },
    
    // ===== ارسال مجدد کد =====
    resendCode: async function() {
        if (!this.resetPhone) return;
        
        // تولید کد جدید
        this.resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        console.log(`📱 کد بازیابی مجدد به ${this.resetPhone} ارسال شد: ${this.resetToken}`);
        
        App.showToast('کد جدید ارسال شد', 'success');
        
        // ریست تایمر
        this.resetTimeLeft = 120;
        this.startResetTimer();
    },
    
    // ===== شروع تایمر =====
    startResetTimer: function() {
        this.resetTimeLeft = 120;
        
        if (this.resetTimerInterval) {
            clearInterval(this.resetTimerInterval);
        }
        
        this.resetTimerInterval = setInterval(() => {
            if (this.resetTimeLeft <= 0) {
                clearInterval(this.resetTimerInterval);
                document.getElementById('resetTimer').textContent = '۰۰:۰۰';
            } else {
                this.resetTimeLeft--;
                const minutes = Math.floor(this.resetTimeLeft / 60);
                const seconds = this.resetTimeLeft % 60;
                document.getElementById('resetTimer').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    },
    
    // ===== رفتن به مرحله =====
    goToStep: function(step) {
        this.currentStep = step;
        
        document.getElementById('resetStep1').style.display = step === 1 ? 'block' : 'none';
        document.getElementById('resetStep2').style.display = step === 2 ? 'block' : 'none';
        document.getElementById('resetStep3').style.display = step === 3 ? 'block' : 'none';
    },
    
    // ===== بستن مودال =====
    closeModal: function() {
        const modal = document.getElementById('passwordResetModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
        
        if (this.resetTimerInterval) {
            clearInterval(this.resetTimerInterval);
        }
        
        this.currentStep = 1;
        this.resetToken = null;
        this.resetPhone = null;
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// مقداردهی اولیه
document.addEventListener('DOMContentLoaded', () => {
    AuthPasswordReset.init();
});

window.AuthPasswordReset = AuthPasswordReset;
