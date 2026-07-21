 /* ============================================
   CSRF-PROTECTION.JS - محافظت در برابر CSRF
   ============================================ */

const CSRFProtection = {
    // توکن CSRF
    token: null,
    
    // ===== تولید توکن CSRF =====
    generateToken: function() {
        this.token = Encryption.generateToken(32);
        // ذخیره در حافظه جلسه
        sessionStorage.setItem('csrf_token', this.token);
        return this.token;
    },
    
    // ===== دریافت توکن CSRF =====
    getToken: function() {
        if (!this.token) {
            this.token = sessionStorage.getItem('csrf_token');
            if (!this.token) {
                this.generateToken();
            }
        }
        return this.token;
    },
    
    // ===== افزودن توکن به هدر درخواست =====
    addTokenToHeaders: function(headers = {}) {
        headers['X-CSRF-Token'] = this.getToken();
        return headers;
    },
    
    // ===== افزودن توکن به فرم =====
    addTokenToForm: function(form) {
        let tokenInput = form.querySelector('input[name="_csrf"]');
        if (!tokenInput) {
            tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = '_csrf';
            form.appendChild(tokenInput);
        }
        tokenInput.value = this.getToken();
    },
    
    // ===== افزودن توکن به همه فرم‌ها =====
    addTokenToAllForms: function() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.addTokenToForm(form);
        });
    },
    
    // ===== اعتبارسنجی توکن =====
    validateToken: function(token) {
        const storedToken = this.getToken();
        return token === storedToken;
    },
    
    // ===== بررسی درخواست =====
    validateRequest: function(requestData) {
        const token = requestData._csrf || requestData.csrf_token;
        if (!token) return false;
        return this.validateToken(token);
    },
    
    // ===== بازنشانی توکن =====
    resetToken: function() {
        this.token = null;
        sessionStorage.removeItem('csrf_token');
        this.generateToken();
    },
    
    // ===== میدلور اعتبارسنجی برای fetch =====
    fetchMiddleware: async function(url, options = {}) {
        const headers = options.headers || {};
        headers['X-CSRF-Token'] = this.getToken();
        
        options.headers = headers;
        
        const response = await fetch(url, options);
        
        // اگر توکن نامعتبر بود، بازنشانی و تلاش مجدد
        if (response.status === 403) {
            this.resetToken();
            headers['X-CSRF-Token'] = this.getToken();
            return await fetch(url, options);
        }
        
        return response;
    },
    
    // ===== تزریق خودکار توکن در fetch =====
    setupAutoToken: function() {
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            return this.fetchMiddleware(url, options);
        };
    },
    
    // ===== بررسی خودکار فرم‌ها =====
    setupAutoForms: function() {
        this.addTokenToAllForms();
        
        // نظارت بر فرم‌های داینامیک
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.tagName === 'FORM') {
                        this.addTokenToForm(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },
    
    // ===== نمایش توکن در کنسول (برای دیباگ) =====
    debugToken: function() {
        console.log('CSRF Token:', this.getToken());
    }
};

window.CSRFProtection = CSRFProtection;
