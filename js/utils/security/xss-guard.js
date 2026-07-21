 /* ============================================
   XSS-GUARD.JS - محافظت در برابر XSS
   ============================================ */

const XSSGuard = {
    // ===== Escape کردن HTML =====
    escapeHtml: function(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\//g, '&#x2F;');
    },
    
    // ===== Unescape کردن HTML =====
    unescapeHtml: function(str) {
        if (!str) return '';
        return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#x2F;/g, '/');
    },
    
    // ===== پاکسازی ورودی =====
    sanitize: function(input) {
        if (typeof input === 'string') {
            return this.escapeHtml(input.trim());
        }
        if (typeof input === 'object' && input !== null) {
            const sanitized = {};
            for (const key in input) {
                sanitized[key] = this.sanitize(input[key]);
            }
            return sanitized;
        }
        return input;
    },
    
    // ===== پاکسازی آرایه =====
    sanitizeArray: function(arr) {
        if (!Array.isArray(arr)) return arr;
        return arr.map(item => this.sanitize(item));
    },
    
    // ===== اعتبارسنجی URL =====
    isValidUrl: function(url) {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch(e) {
            return false;
        }
    },
    
    // ===== اعتبارسنجی پروتکل =====
    isValidProtocol: function(url) {
        const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:'];
        for (const proto of dangerous) {
            if (url.toLowerCase().startsWith(proto)) {
                return false;
            }
        }
        return true;
    },
    
    // ===== پاکسازی URL =====
    sanitizeUrl: function(url) {
        if (!url) return '';
        if (!this.isValidProtocol(url)) return '#';
        if (!this.isValidUrl(url)) return '#';
        return url;
    },
    
    // ===== حذف تگ‌های script =====
    removeScriptTags: function(html) {
        if (!html) return '';
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    },
    
    // ===== حذف event handlerها =====
    removeEventHandlers: function(html) {
        if (!html) return '';
        return html.replace(/on\w+="[^"]*"/gi, '');
    },
    
    // ===== پاکسازی HTML (مجاز نگه داشتن تگ‌های امن) =====
    sanitizeHtml: function(html, allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'div', 'span']) {
        if (!html) return '';
        
        // حذف اسکریپت‌ها
        let cleaned = this.removeScriptTags(html);
        cleaned = this.removeEventHandlers(cleaned);
        
        // حذف تگ‌های غیرمجاز
        const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
        cleaned = cleaned.replace(tagRegex, (match, tagName) => {
            if (allowedTags.includes(tagName.toLowerCase())) {
                return match;
            }
            return '';
        });
        
        return cleaned;
    },
    
    // ===== نظارت بر DOM برای تزریق اسکریپت =====
    observeDOM: function() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // عنصر HTML
                        if (node.tagName === 'SCRIPT') {
                            node.remove();
                        }
                        if (node.hasAttribute && node.hasAttribute('onload')) {
                            node.removeAttribute('onload');
                        }
                        if (node.hasAttribute && node.hasAttribute('onerror')) {
                            node.removeAttribute('onerror');
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },
    
    // ===== بررسی متن برای الگوهای XSS =====
    detectXSS: function(text) {
        if (!text) return false;
        
        const patterns = [
            /<script\b/i,
            /javascript:/i,
            /on\w+=/i,
            /<iframe\b/i,
            /<object\b/i,
            /<embed\b/i,
            /<link\b/i,
            /expression\(/i,
            /alert\(/i,
            /prompt\(/i,
            /confirm\(/i
        ];
        
        for (const pattern of patterns) {
            if (pattern.test(text)) {
                return true;
            }
        }
        return false;
    },
    
    // ===== لاگ حملات XSS =====
    logXSSAttempt: function(input, source = 'unknown') {
        const log = {
            timestamp: new Date().toISOString(),
            source: source,
            input: input.substring(0, 500),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.warn('⚠️ XSS Attack Detected:', log);
        
        // ذخیره در localStorage برای بررسی بعدی
        const attacks = JSON.parse(localStorage.getItem('xss_attacks') || '[]');
        attacks.push(log);
        localStorage.setItem('xss_attacks', JSON.stringify(attacks.slice(-50)));
    },
    
    // ===== ورودی امن برای innerHTML =====
    safeInnerHTML: function(element, content) {
        if (this.detectXSS(content)) {
            this.logXSSAttempt(content, 'innerHTML');
            element.textContent = '⚠️ محتوای غیرمجاز';
        } else {
            element.innerHTML = this.sanitizeHtml(content);
        }
    },
    
    // ===== شروع حفاظت خودکار =====
    initProtection: function() {
        // نظارت بر DOM
        this.observeDOM();
        
        // محافظت از innerHTML اصلی
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (originalInnerHTML) {
            Object.defineProperty(Element.prototype, 'innerHTML', {
                get: originalInnerHTML.get,
                set: function(value) {
                    if (XSSGuard.detectXSS(value)) {
                        XSSGuard.logXSSAttempt(value, 'innerHTML');
                        originalInnerHTML.set.call(this, '⚠️ محتوای غیرمجاز');
                    } else {
                        originalInnerHTML.set.call(this, XSSGuard.sanitizeHtml(value));
                    }
                }
            });
        }
        
        console.log('🛡️ XSS Guard فعال شد');
    }
};

window.XSSGuard = XSSGuard;
