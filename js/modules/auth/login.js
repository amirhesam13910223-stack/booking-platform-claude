 /* ============================================
   LOGIN.JS - ورود به سیستم
   ============================================ */

const AuthLogin = {
    // فرم ورود
    form: null,
    
    // وضعیت
    isLoading: false,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.form = document.getElementById('loginForm');
        if (this.form) {
            this.attachEvents();
        }
        
        // گوش دادن به رویدادها
        App.on('modal:opened', (data) => {
            if (data.modalId === 'loginModal') {
                this.resetForm();
            }
        });
        
        console.log('🔐 ماژول Login راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // اعتبارسنجی بلادرنگ
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    },
    
    // ===== پردازش ورود =====
    handleLogin: async function() {
        if (this.isLoading) return;
        
        // دریافت مقادیر
        const username = document.getElementById('loginUsername')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        const remember = document.getElementById('loginRemember')?.checked;
        
        // اعتبارسنجی
        if (!this.validateForm(username, password)) {
            return;
        }
        
        this.setLoading(true);
        
        try {
            // شبیه‌سازی درخواست به سرور
            const response = await this.authenticateUser(username, password, remember);
            
            if (response.success) {
                this.onLoginSuccess(response.user);
            } else {
                this.onLoginError(response.message);
            }
        } catch (error) {
            console.error('خطا در ورود:', error);
            this.onLoginError('خطا در ارتباط با سرور');
        } finally {
            this.setLoading(false);
        }
    },
    
    // ===== احراز هویت کاربر (شبیه‌سازی) =====
    authenticateUser: async function(username, password, remember) {
        // شبیه‌سازی تاخیر شبکه
        await this.delay(800);
        
        // بررسی اعتبار (دمو)
        const isValid = (username === '09121234567' || username === 'test@example.com') && password === '123456';
        
        if (isValid) {
            // تولید توکن شبیه‌سازی
            const token = this.generateToken();
            
            // اطلاعات کاربر
            const user = {
                id: 1,
                name: 'کاربر تست',
                email: username.includes('@') ? username : 'test@example.com',
                phone: username.includes('@') ? '09121234567' : username,
                avatar: null,
                role: 'user',
                token: token,
                preferences: {
                    theme: 'light',
                    notifications: true
                }
            };
            
            // ذخیره در localStorage
            if (remember) {
                localStorage.setItem('auth_token', token);
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                sessionStorage.setItem('auth_token', token);
                sessionStorage.setItem('user', JSON.stringify(user));
            }
            
            return { success: true, user: user };
        }
        
        return { success: false, message: 'نام کاربری یا رمز عبور اشتباه است' };
    },
    
    // ===== موفقیت در ورود =====
    onLoginSuccess: function(user) {
        // به‌روزرسانی State
        StateManager.login(user);
        
        // ارسال رویداد
        App.emit(SystemEvents.AUTH_LOGIN, { user });
        
        // نمایش پیام خوش‌آمدگویی
        App.showToast(`خوش آمدید ${user.name}`, 'success');
        
        // بستن مودال
        App.closeModal('loginModal');
        
        // پاک کردن فرم
        this.resetForm();
        
        // به‌روزرسانی UI
        this.updateUIAfterLogin(user);
        
        // هدایت بر اساس نقش
        this.redirectBasedOnRole(user.role);
    },
    
    // ===== خطا در ورود =====
    onLoginError: function(message) {
        App.showToast(message, 'error');
        
        // نمایش خطا در فرم
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        } else {
            // ایجاد المان خطا
            this.showFormError(message);
        }
    },
    
    // ===== به‌روزرسانی UI پس از ورود =====
    updateUIAfterLogin: function(user) {
        // مخفی کردن دکمه‌های ورود/ثبت‌نام
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        
        // اضافه کردن دکمه پروفایل
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !document.getElementById('userMenuBtn')) {
            const userBtn = document.createElement('button');
            userBtn.id = 'userMenuBtn';
            userBtn.className = 'btn btn-outline user-menu-btn';
            userBtn.innerHTML = `👤 ${user.name.split(' ')[0]}`;
            userBtn.addEventListener('click', () => this.showUserMenu());
            headerActions.appendChild(userBtn);
        }
    },
    
    // ===== نمایش منوی کاربر =====
    showUserMenu: function() {
        const user = StateManager.get('user');
        if (!user) return;
        
        const menu = document.createElement('div');
        menu.className = 'user-menu-dropdown';
        menu.innerHTML = `
            <div class="user-menu-header">
                <div class="user-menu-avatar">${user.name.charAt(0)}</div>
                <div class="user-menu-info">
                    <strong>${user.name}</strong>
                    <small>${user.phone || user.email}</small>
                </div>
            </div>
            <div class="user-menu-divider"></div>
            <a href="/profile" class="user-menu-item">👤 پروفایل من</a>
            <a href="/my-bookings" class="user-menu-item">📅 نوبت‌های من</a>
            <a href="/wallet" class="user-menu-item">💰 کیف پول</a>
            <a href="/loyalty" class="user-menu-item">⭐ امتیازات من</a>
            <div class="user-menu-divider"></div>
            <button class="user-menu-item logout-btn" id="logoutBtn">🚪 خروج از حساب</button>
        `;
        
        document.body.appendChild(menu);
        
        // موقعیت‌یابی منو
        const btn = document.getElementById('userMenuBtn');
        const rect = btn.getBoundingClientRect();
        menu.style.top = rect.bottom + 5 + 'px';
        menu.style.left = rect.left + 'px';
        
        // نمایش منو
        setTimeout(() => menu.classList.add('show'), 10);
        
        // بستن منو با کلیک خارج
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 100);
        
        // دکمه خروج
        const logoutBtn = menu.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                AuthSession.logout();
                menu.remove();
            });
        }
    },
    
    // ===== هدایت بر اساس نقش =====
    redirectBasedOnRole: function(role) {
        if (role === 'admin' && window.location.pathname !== '/admin') {
            Router.navigateTo('/admin');
        } else if (role === 'business' && window.location.pathname !== '/business') {
            Router.navigateTo('/business');
        } else if (window.location.pathname === '/login' || window.location.pathname === '/register') {
            Router.navigateTo('/');
        }
    },
    
    // ===== اعتبارسنجی فرم =====
    validateForm: function(username, password) {
        if (!username || username.trim() === '') {
            this.showFieldError('loginUsername', 'لطفاً نام کاربری یا ایمیل را وارد کنید');
            return false;
        }
        
        if (!password || password === '') {
            this.showFieldError('loginPassword', 'لطفاً رمز عبور را وارد کنید');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError('loginPassword', 'رمز عبور باید حداقل ۶ کاراکتر باشد');
            return false;
        }
        
        return true;
    },
    
    // ===== اعتبارسنجی فیلد =====
    validateField: function(input) {
        const id = input.id;
        const value = input.value.trim();
        
        if (id === 'loginUsername') {
            if (!value) {
                this.showFieldError(id, 'این فیلد الزامی است');
                return false;
            }
            this.clearFieldError(input);
            return true;
        }
        
        if (id === 'loginPassword') {
            if (!value) {
                this.showFieldError(id, 'این فیلد الزامی است');
                return false;
            }
            if (value.length < 6) {
                this.showFieldError(id, 'حداقل ۶ کاراکتر');
                return false;
            }
            this.clearFieldError(input);
            return true;
        }
        
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
                submitBtn.innerHTML = '<span class="spinner"></span> در حال ورود...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'ورود';
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

// استایل‌های داینامیک برای منوی کاربر
const userMenuStyles = `
<style>
.user-menu-dropdown {
    position: fixed;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    min-width: 220px;
    z-index: 1100;
    opacity: 0;
    transform: translateY(-10px);
    transition: all var(--transition-fast);
}
.user-menu-dropdown.show {
    opacity: 1;
    transform: translateY(0);
}
.user-menu-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
}
.user-menu-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
    color: white;
}
.user-menu-info {
    flex: 1;
}
.user-menu-info strong {
    display: block;
    color: var(--text-primary);
}
.user-menu-info small {
    font-size: 12px;
    color: var(--text-tertiary);
}
.user-menu-divider {
    height: 1px;
    background: var(--border-color);
    margin: 4px 0;
}
.user-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    color: var(--text-secondary);
    transition: all var(--transition-fast);
    cursor: pointer;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    font-size: 14px;
}
.user-menu-item:hover {
    background: var(--bg-secondary);
    color: var(--color-primary);
}
.logout-btn {
    color: var(--color-danger);
}
.logout-btn:hover {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}
.spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}
.form-error {
    background: var(--color-danger-soft);
    color: var(--color-danger);
    padding: 10px;
    border-radius: var(--radius-md);
    margin-bottom: 16px;
    font-size: 14px;
    text-align: center;
}
</style>
`;

// اضافه کردن استایل‌ها
if (!document.querySelector('#auth-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'auth-styles';
    styleSheet.textContent = userMenuStyles;
    document.head.appendChild(styleSheet);
}

// مقداردهی اولیه
document.addEventListener('DOMContentLoaded', () => {
    AuthLogin.init();
});

window.AuthLogin = AuthLogin;
