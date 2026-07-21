 /* ============================================
   API-CLIENT.JS - کلاینت درخواست‌های API
   ============================================ */

const APIClient = {
    // تنظیمات پایه
    config: {
        baseURL: '/api',
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        withCredentials: false
    },
    
    // interceptorها
    requestInterceptors: [],
    responseInterceptors: [],
    errorInterceptors: [],
    
    // ===== تنظیمات =====
    setConfig: function(config) {
        this.config = { ...this.config, ...config };
    },
    
    // ===== اضافه کردن هدر =====
    addHeader: function(key, value) {
        this.config.headers[key] = value;
    },
    
    // ===== حذف هدر =====
    removeHeader: function(key) {
        delete this.config.headers[key];
    },
    
    // ===== تنظیم توکن احراز هویت =====
    setAuthToken: function(token) {
        if (token) {
            this.config.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.config.headers['Authorization'];
        }
    },
    
    // ===== افزودن interceptor =====
    addRequestInterceptor: function(interceptor) {
        this.requestInterceptors.push(interceptor);
    },
    
    addResponseInterceptor: function(interceptor) {
        this.responseInterceptors.push(interceptor);
    },
    
    addErrorInterceptor: function(interceptor) {
        this.errorInterceptors.push(interceptor);
    },
    
    // ===== اجرای interceptors =====
    async runInterceptors(interceptors, data) {
        let result = data;
        for (const interceptor of interceptors) {
            result = await interceptor(result);
        }
        return result;
    },
    
    // ===== درخواست اصلی =====
    async request(url, options = {}) {
        const startTime = Date.now();
        
        // ترکیب تنظیمات
        const config = {
            ...this.config,
            ...options,
            headers: { ...this.config.headers, ...options.headers }
        };
        
        let fullUrl = url.startsWith('http') ? url : this.config.baseURL + url;
        
        // اجرای request interceptors
        let requestData = { url: fullUrl, options: config };
        requestData = await this.runInterceptors(this.requestInterceptors, requestData);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        try {
            const response = await fetch(requestData.url, {
                ...requestData.options,
                signal: controller.signal,
                headers: requestData.options.headers
            });
            
            clearTimeout(timeoutId);
            
            // پردازش پاسخ
            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            const result = {
                data: data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                duration: Date.now() - startTime
            };
            
            if (!response.ok) {
                throw result;
            }
            
            // اجرای response interceptors
            return await this.runInterceptors(this.responseInterceptors, result);
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            const errorResult = {
                message: error.message || 'خطا در ارتباط با سرور',
                status: error.status || 0,
                data: error.data || null,
                duration: Date.now() - startTime
            };
            
            // اجرای error interceptors
            return await this.runInterceptors(this.errorInterceptors, errorResult);
        }
    },
    
    // ===== متدهای HTTP =====
    get: function(url, params = {}, options = {}) {
        const queryString = new URLSearchParams(params).toString();
        const finalUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(finalUrl, { ...options, method: 'GET' });
    },
    
    post: function(url, data = {}, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put: function(url, data = {}, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    patch: function(url, data = {}, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    
    delete: function(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    },
    
    // ===== آپلود فایل =====
    upload: function(url, file, fieldName = 'file', additionalData = {}, options = {}) {
        const formData = new FormData();
        formData.append(fieldName, file);
        
        for (const [key, value] of Object.entries(additionalData)) {
            formData.append(key, value);
        }
        
        return this.request(url, {
            ...options,
            method: 'POST',
            body: formData,
            headers: {
                ...options.headers,
                'Content-Type': undefined // اجازه دهید مرورگر تعیین کند
            }
        });
    },
    
    // ===== دانلود فایل =====
    download: async function(url, filename, params = {}) {
        const response = await this.get(url, params, { responseType: 'blob' });
        
        if (response.status === 200) {
            const blob = new Blob([response.data]);
            const link = document.createElement('a');
            const objectUrl = URL.createObjectURL(blob);
            link.href = objectUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
            return true;
        }
        
        throw new Error('دانلود فایل ناموفق بود');
    },
    
    // ===== درخواست همزمان =====
    all: function(requests) {
        return Promise.all(requests);
    },
    
    // ===== درخواست با تلاش مجدد =====
    requestWithRetry: async function(url, options = {}, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.request(url, options);
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }
        
        throw lastError;
    },
    
    // ===== دریافت وضعیت سرور =====
    healthCheck: async function() {
        try {
            const response = await this.get('/health');
            return response.status === 200;
        } catch {
            return false;
        }
    }
};

window.APIClient = APIClient;
