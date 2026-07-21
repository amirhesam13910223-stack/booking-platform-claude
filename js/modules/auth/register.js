/* ============================================
   REGISTER.JS - ثبت‌نام کاربر جدید
   ============================================ */

   const AuthRegister = {
    // فرم ثبت‌نام
    form: null,
    
    // وضعیت
    isLoading: false,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.form = document.getElementById('registerForm');
        if (this.form) {
            this.attachEvents();
        }
        
        // گوش دادن به رویدادها
        App.on('modal:opened', (data) => {
            if (data.modalId === 'registerModal') {
                this.resetForm();
            }
        });
        
        console.log('📝 ماژول Register راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        // اعتبارسنجی بلادرنگ
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    },
    
    // ===== پردازش ثبت‌نام =====
    handleRegister: async function() {
        if (this.isLoading) return;
        
        // دریافت مقادیر
        const fullName = document.getElementById('regFullName')?.value.trim();
        const phone = document.getElementById('regPhone')?.value.trim();
        const email = document.getElementById('regEmail')?.value.trim();
        const password = document.getElementById('regPassword')?.value;
        const passwordConfirm = document.getElementById('regPasswordConfirm')?.value;
        const termsAccepted = document.getElementById('regTerms')?.checked;
        
        // اعتبارسنجی
        if (!this.validateForm(fullName, phone, password, passwordConfirm, termsAccepted)) {
            return;
        }
        
        this.setLoading(true);
        
        try {
            // شبیه‌سازی درخواست به سرور
            const response = await this.registerUser(fullName, phone, email, password);
            
            if (response.success) {
                this.onRegisterSuccess(response.user);
            } else {
                this.onRegisterError(response.message);
            }
        } catch (error) {
            console.error('خطا در ثبت‌نام:', error);
            this.onRegisterError('خطا در ارتباط با سرور');
        } finally {
            this.setLoading(false);
        }
    },
    
    // ===== ثبت‌نام کاربر (شبیه‌سازی) =====
    registerUser: async function(fullName, phone, email, password) {
        // شبیه‌سازی تاخیر شبکه
        await this.delay(1000);
        
        // بررسی تکراری بودن (شبیه‌سازی)
        const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const isPhoneExists = existingUsers.some(u => u.phone === phone);
        
        if (isPhoneExists) {
            return { success: false, message: 'این شماره تماس قبلاً ثبت‌نام کرده است' };
        }
        
        // تولید توکن
        const token = this.generateToken();
        
        // اطلاعات کاربر جدید
        const user = {
            id: Date.now(),
            name: fullName,
            phone: phone,
            email: email || null,
            avatar: null,
            role: 'user',
            token: token,
            createdAt: new Date().toISOString(),
            preferences: {
                theme: 'light',
                notifications: true
            }
        };
        
        // ذخیره در localStorage
        existingUsers.push({ phone, name: fullName, email });
        localStorage.setItem('registered_users', JSON.stringify(existingUsers));
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // ارسال پیامک خوش‌آمدگویی (شبیه‌سازی)
        this.sendWelcomeSMS(phone, fullName);
        
        return { success: true, user: user };
    },
    
    // ===== ارسال پیامک خوش‌آمدگویی =====
    sendWelcomeSMS: function(phone, name) {
        console.log(`📱 پیامک خوش‌آمدگویی به ${phone} ارسال شد: کاربر ${name} عزیز به پلتفرم نوبت‌دهی خوش آمدید`);
        // در حالت واقعی، اینجا API پیامک وصل می‌شود
    },
    
    // ===== موفقیت در ثبت‌نام =====
    onRegisterSuccess: function(user) {
        // به‌روزرسانی State
        StateManager.login(user);
        
        // ارسال رویداد
        App.emit(SystemEvents.AUTH_LOGIN, { user, isNewUser: true });
        
        // نمایش پیام خوش‌آمدگویی
        App.showToast(`ثبت‌نام با موفقیت انجام شد! خوش آمدید ${user.name}`, 'success');
        
        // بستن مودال
        App.closeModal('registerModal');
        
        // پاک کردن فرم
        this.resetForm();
        
        // به‌روزرسانی UI
        if (window.AuthLogin) {
            AuthLogin.updateUIAfterLogin(user);
        }
        
        // نمایش پاداش ثبت‌نام
        this.showWelcomeBonus(user);
    },
    
    // ===== نمایش پاداش ثبت‌نام =====
    showWelcomeBonus: function(user) {
        setTimeout(() => {
            App.showToast('🎁 ۱۰۰ امتیاز به حساب شما اضافه شد!', 'success');
        }, 1000);
    },
    
    // ===== خطا در ثبت‌نام =====
    onRegisterError: function(message) {
        App.showToast(message, 'error');
        this.showFormError(message);
    },
    
    // ===== اعتبارسنجی فرم =====
    validateForm: function(fullName, phone, password, passwordConfirm, termsAccepted) {
        // نام کامل
        if (!fullName || fullName.length < 3) {
            this.showFieldError('regFullName', 'نام کامل باید حداقل ۳ کاراکتر باشد');
            return false;
        }
        
        // شماره تماس
        if (!phone) {
            this.showFieldError('regPhone', 'لطفاً شماره تماس را وارد کنید');
            return false;
        }
        
        const phoneRegex = /^09[0-9]{9}$/;
        if (!phoneRegex.test(phone)) {
            this.showFieldError('regPhone', 'شماره تماس معتبر نیست (مثال: 09121234567)');
            return false;
        }
        
        // ایمیل (اختیاری)
        if (document.getElementById('regEmail').value.trim()) {
            const email = document.getElementById('regEmail').value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showFieldError('regEmail', 'ایمیل معتبر نیست');
                return false;
            }
        }
        
        // رمز عبور
        if (!password) {
            this.showFieldError('regPassword', 'لطفاً رمز عبور را وارد کنید');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError('regPassword', 'رمز عبور باید حداقل ۶ کاراکتر باشد');
            return false;
        }
        
        // تکرار رمز عبور
        if (password !== passwordConfirm) {
            this.showFieldError('regPasswordConfirm', 'رمز عبور و تکرار آن مطابقت ندارند');
            return false;
        }
        
        // پذیرش قوانین
        if (!termsAccepted) {
            this.showFormError('لطفاً قوانین و مقررات را بپذیرید');
            return false;
        }
        
        return true;
    },
    
    // ===== اعتبارسنجی فیلد =====
    validateField: function(input) {
        const id = input.id;
        const value = input.value.trim();
        
        switch(id) {
            case 'regFullName':
                if (!value || value.length < 3) {
                    this.showFieldError(id, 'حداقل ۳ کاراکتر');
                    return false;
                }
                break;
                
            case 'regPhone':
                if (!value) {
                    this.showFieldError(id, 'این فیلد الزامی است');
                    return false;
                }
                const phoneRegex = /^09[0-9]{9}$/;
                if (!phoneRegex.test(value)) {
                    this.showFieldError(id, 'شماره تماس معتبر نیست');
                    return false;
                }
                break;
                
            case 'regEmail':
                if (value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        this.showFieldError(id, 'ایمیل معتبر نیست');
                        return false;
                    }
                }
                break;
                
            case 'regPassword':
                if (!value) {
                    this.showFieldError(id, 'این فیلد الزامی است');
                    return false;
                }
                if (value.length < 6) {
                    this.showFieldError(id, 'حداقل ۶ کاراکتر');
                    return false;
                }
                break;
                
            case 'regPasswordConfirm':
                const password = document.getElementById('regPassword')?.value;
                if (value !== password) {
                    this.showFieldError(id, 'مطابقت ندارد');
                    return false;
                }
                break;
        }
        
        this.clearFieldError(input);
        return true;
    },
    
    // ===== نمایش خطای فیلد =====
    showFieldError: function(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('is-invalid');
            
            let errorDiv = field.parentElement.querySelector('.invalid-feedback');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                field.parentElement.appendChild(errorDiv);
            }
            errorDiv.textContent = message;
        }
    },
    
    // ===== پاک کردن خطای فیلد =====
    clearFieldError: function(field) {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentElement.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    },
    
    // ===== نمایش خطای کلی فرم =====
    showFormError: function(message) {
        const form = this.form;
        let errorDiv = form.querySelector('.form-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            form.insertBefore(errorDiv, form.firstChild);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    },
    
    // ===== تنظیم وضعیت لودینگ =====
    setLoading: function(loading) {
        this.isLoading = loading;
        const submitBtn = this.form.querySelector('button[type="submit"]');
        
        if (submitBtn) {
            if (loading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner"></span> در حال ثبت‌نام...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'ثبت‌نام';
            }
        }
    },
    
    // ===== پاک کردن فرم =====
    resetForm: function() {
        if (this.form) {
            this.form.reset();
            const inputs = this.form.querySelectorAll('.is-invalid');
            inputs.forEach(input => {
                input.classList.remove('is-invalid');
            });
            const errors = this.form.querySelectorAll('.invalid-feedback, .form-error');
            errors.forEach(error => error.remove());
        }
    },
    
    // ===== تولید توکن =====
    generateToken: function() {
        return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// مقداردهی اولیه
document.addEventListener('DOMContentLoaded', () => {
    AuthRegister.init();
});

window.AuthRegister = AuthRegister;