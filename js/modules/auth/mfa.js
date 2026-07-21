 /* ============================================
   MFA.JS - احراز هویت دو مرحله‌ای
   ============================================ */

const AuthMFA = {
    // وضعیت
    isMFAEnabled: false,
    mfaCode: null,
    mfaTimer: null,
    timeLeft: 120, // 2 دقیقه
    
    // ===== مقداردهی اولیه =====
    init: function() {
        // بررسی فعال بودن MFA برای کاربر
        this.checkMFAStatus();
        
        // گوش دادن به رویداد ورود
        App.on(SystemEvents.AUTH_LOGIN, (data) => {
            if (data.user.mfaEnabled) {
                this.requestMFA(data.user);
            }
        });
        
        console.log('🔐 ماژول MFA راه‌اندازی شد');
    },
    
    // ===== بررسی وضعیت MFA =====
    checkMFAStatus: function() {
        const user = StateManager.get('user');
        if (user && user.mfaEnabled) {
            this.isMFAEnabled = true;
        }
    },
    
    // ===== درخواست کد MFA =====
    requestMFA: function(user) {
        // تولید کد ۶ رقمی
        this.mfaCode = this.generateCode();
        this.timeLeft = 120;
        
        // شبیه‌سازی ارسال پیامک
        this.sendMFACode(user.phone, this.mfaCode);
        
        // نمایش مودال MFA
        this.showMFAModal(user);
        
        // شروع تایمر
        this.startTimer();
    },
    
    // ===== ارسال کد MFA =====
    sendMFACode: function(phone, code) {
        console.log(`📱 کد MFA به ${phone} ارسال شد: ${code}`);
        // در حالت واقعی، اینجا API پیامک وصل می‌شود
    },
    
    // ===== نمایش مودال MFA =====
    showMFAModal: function(user) {
        // حذف مودال قبلی اگر وجود دارد
        const existingModal = document.getElementById('mfaModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // ایجاد مودال
        const modal = document.createElement('div');
        modal.id = 'mfaModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-sm">
                <div class="modal-header">
                    <h3>✅ احراز هویت دو مرحله‌ای</h3>
                    <button class="modal-close" onclick="AuthMFA.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="text-align: center; margin-bottom: 20px;">
                        کد تأیید به شماره ${this.maskPhone(user.phone)} ارسال شد.
                    </p>
                    <div class="form-group">
                        <label>کد تأیید ۶ رقمی</label>
                        <input type="text" id="mfaCodeInput" class="form-control text-center" 
                               placeholder="_ _ _ _ _ _" maxlength="6" autocomplete="off"
                               style="text-align: center; font-size: 24px; letter-spacing: 8px;">
                    </div>
                    <div class="mfa-timer" style="text-align: center; margin: 15px 0;">
                        <span class="timer-label">زمان باقی‌مانده: </span>
                        <span id="mfaTimer" class="timer-value" style="color: var(--color-danger); font-weight: bold;">02:00</span>
                    </div>
                    <div class="mfa-actions" style="display: flex; gap: 10px; flex-direction: column;">
                        <button class="btn btn-primary btn-block" onclick="AuthMFA.verifyCode()">تأیید</button>
                        <button class="btn btn-outline btn-block" onclick="AuthMFA.resendCode()">ارسال مجدد کد</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // فوکوس روی input
        const input = document.getElementById('mfaCodeInput');
        if (input) {
            input.focus();
            
            // اعتبارسنجی بلادرنگ
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                if (e.target.value.length === 6) {
                    this.verifyCode();
                }
            });
            
            // با Enter
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.verifyCode();
                }
            });
        }
        
        // جلوگیری از اسکرول
        document.body.style.overflow = 'hidden';
    },
    
    // ===== ماسک کردن شماره تماس =====
    maskPhone: function(phone) {
        if (!phone) return '****';
        return phone.slice(0, 4) + '****' + phone.slice(-4);
    },
    
    // ===== شروع تایمر =====
    startTimer: function() {
        if (this.mfaTimer) clearInterval(this.mfaTimer);
        
        this.mfaTimer = setInterval(() => {
            if (this.timeLeft <= 0) {
                clearInterval(this.mfaTimer);
                this.onTimerExpired();
            } else {
                this.timeLeft--;
                this.updateTimerDisplay();
            }
        }, 1000);
    },
    
    // ===== به‌روزرسانی نمایش تایمر =====
    updateTimerDisplay: function() {
        const timerEl = document.getElementById('mfaTimer');
        if (timerEl) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    },
    
    // ===== انقضای زمان =====
    onTimerExpired: function() {
        App.showToast('زمان کد تأیید به پایان رسید. لطفاً دوباره تلاش کنید', 'error');
        this.closeModal();
    },
    
    // ===== تأیید کد =====
    verifyCode: function() {
        const input = document.getElementById('mfaCodeInput');
        const code = input?.value;
        
        if (!code || code.length !== 6) {
            App.showToast('لطفاً کد ۶ رقمی را وارد کنید', 'warning');
            return;
        }
        
        if (code === this.mfaCode) {
            this.onVerificationSuccess();
        } else {
            this.onVerificationFailed();
        }
    },
    
    // ===== موفقیت در تأیید =====
    onVerificationSuccess: function() {
        clearInterval(this.mfaTimer);
        this.closeModal();
        App.showToast('✅ احراز هویت با موفقیت انجام شد', 'success');
        
        // ادامه فرآیند ورود
        App.emit('mfa:verified', { success: true });
    },
    
    // ===== خطا در تأیید =====
    onVerificationFailed: function() {
        App.showToast('❌ کد تأیید اشتباه است', 'error');
        
        const input = document.getElementById('mfaCodeInput');
        if (input) {
            input.value = '';
            input.focus();
            input.classList.add('is-invalid');
            setTimeout(() => input.classList.remove('is-invalid'), 500);
        }
    },
    
    // ===== ارسال مجدد کد =====
    resendCode: function() {
        // تولید کد جدید
        this.mfaCode = this.generateCode();
        this.timeLeft = 120;
        this.startTimer();
        
        const user = StateManager.get('user');
        if (user) {
            this.sendMFACode(user.phone, this.mfaCode);
        }
        
        App.showToast('کد جدید ارسال شد', 'success');
    },
    
    // ===== بستن مودال =====
    closeModal: function() {
        const modal = document.getElementById('mfaModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
        
        if (this.mfaTimer) {
            clearInterval(this.mfaTimer);
        }
    },
    
    // ===== تولید کد ۶ رقمی =====
    generateCode: function() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },
    
    // ===== فعال کردن MFA برای کاربر =====
    enableMFA: async function() {
        // شبیه‌سازی فعال‌سازی
        App.showToast('در حال فعال‌سازی احراز هویت دو مرحله‌ای...', 'info');
        
        await this.delay(1000);
        
        // به‌روزرسانی کاربر
        const user = StateManager.get('user');
        if (user) {
            user.mfaEnabled = true;
            localStorage.setItem('user', JSON.stringify(user));
            StateManager.set('user', user);
        }
        
        App.showToast('✅ احراز هویت دو مرحله‌ای فعال شد', 'success');
    },
    
    // ===== غیرفعال کردن MFA =====
    disableMFA: async function() {
        const confirmed = confirm('آیا از غیرفعال کردن احراز هویت دو مرحله‌ای مطمئن هستید؟');
        
        if (confirmed) {
            const user = StateManager.get('user');
            if (user) {
                user.mfaEnabled = false;
                localStorage.setItem('user', JSON.stringify(user));
                StateManager.set('user', user);
            }
            App.showToast('احراز هویت دو مرحله‌ای غیرفعال شد', 'info');
        }
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// مقداردهی اولیه
document.addEventListener('DOMContentLoaded', () => {
    AuthMFA.init();
});

window.AuthMFA = AuthMFA;
