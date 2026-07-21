 /* ============================================
   OFFLINE-QUEUE.JS - مدیریت درخواست‌های آفلاین
   ============================================ */

const OfflineQueue = {
    // صف درخواست‌ها
    queue: [],
    
    // وضعیت پردازش
    isProcessing: false,
    
    // تنظیمات
    config: {
        maxRetries: 3,
        retryDelay: 5000,
        persistKey: 'offline_queue'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadQueue();
        this.setupNetworkListeners();
        console.log('📦 Offline Queue راه‌اندازی شد');
    },
    
    // ===== بارگذاری صف از localStorage =====
    loadQueue: function() {
        const saved = localStorage.getItem(this.config.persistKey);
        if (saved) {
            try {
                this.queue = JSON.parse(saved);
                console.log(`📋 ${this.queue.length} درخواست در صف آفلاین بارگذاری شد`);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره صف =====
    saveQueue: function() {
        localStorage.setItem(this.config.persistKey, JSON.stringify(this.queue));
    },
    
    // ===== تنظیم شنونده‌های شبکه =====
    setupNetworkListeners: function() {
        window.addEventListener('online', () => {
            console.log('🌐 اتصال به اینترنت برقرار شد');
            this.processQueue();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 اتصال به اینترنت قطع شد');
        });
    },
    
    // ===== افزودن درخواست به صف =====
    add: function(request) {
        const queueItem = {
            id: Date.now() + Math.random().toString(36).substr(2, 6),
            url: request.url,
            method: request.method || 'POST',
            body: request.body,
            headers: request.headers || {},
            retries: 0,
            createdAt: new Date().toISOString(),
            onSuccess: request.onSuccess,
            onError: request.onError
        };
        
        this.queue.push(queueItem);
        this.saveQueue();
        
        console.log(`📥 درخواست به صف آفلاین اضافه شد (ID: ${queueItem.id})`);
        
        // اگر آنلاین هستیم، بلافاصله پردازش کن
        if (navigator.onLine) {
            this.processQueue();
        }
        
        return queueItem.id;
    },
    
    // ===== پردازش صف =====
    processQueue: async function() {
        if (!navigator.onLine) {
            console.log('📴 دستگاه آفلاین است، صف پردازش نمی‌شود');
            return;
        }
        
        if (this.isProcessing) {
            console.log('⏳ صف در حال پردازش است');
            return;
        }
        
        if (this.queue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        console.log(`🔄 شروع پردازش ${this.queue.length} درخواست در صف آفلاین`);
        
        while (this.queue.length > 0) {
            const item = this.queue[0];
            const success = await this.processItem(item);
            
            if (success) {
                this.queue.shift();
                this.saveQueue();
            } else {
                if (item.retries >= this.config.maxRetries) {
                    console.error(`❌ درخواست ${item.id} پس از ${this.config.maxRetries} تلاش ناموفق بود`);
                    this.queue.shift();
                    this.saveQueue();
                    
                    if (item.onError) {
                        item.onError(new Error('Max retries exceeded'));
                    }
                } else {
                    item.retries++;
                    this.saveQueue();
                    console.log(`⏳ تلاش مجدد ${item.retries}/${this.config.maxRetries} برای درخواست ${item.id}`);
                    await this.delay(this.config.retryDelay);
                }
            }
        }
        
        this.isProcessing = false;
        console.log('✅ پردازش صف آفلاین کامل شد');
    },
    
    // ===== پردازش یک درخواست =====
    processItem: async function(item) {
        try {
            const options = {
                method: item.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...item.headers
                }
            };
            
            if (item.body) {
                options.body = typeof item.body === 'string' ? item.body : JSON.stringify(item.body);
            }
            
            const response = await fetch(item.url, options);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ درخواست ${item.id} با موفقیت ارسال شد`);
                
                if (item.onSuccess) {
                    item.onSuccess(data);
                }
                
                return true;
            } else {
                console.warn(`⚠️ درخواست ${item.id} با وضعیت ${response.status} ناموفق بود`);
                return false;
            }
        } catch (error) {
            console.warn(`⚠️ خطا در ارسال درخواست ${item.id}:`, error);
            return false;
        }
    },
    
    // ===== حذف درخواست از صف =====
    remove: function(id) {
        const index = this.queue.findIndex(item => item.id === id);
        if (index !== -1) {
            this.queue.splice(index, 1);
            this.saveQueue();
            return true;
        }
        return false;
    },
    
    // ===== پاک کردن صف =====
    clear: function() {
        this.queue = [];
        this.saveQueue();
        console.log('🧹 صف آفلاین پاک شد');
    },
    
    // ===== دریافت وضعیت صف =====
    getStatus: function() {
        return {
            queueSize: this.queue.length,
            isProcessing: this.isProcessing,
            isOnline: navigator.onLine,
            items: this.queue.map(item => ({
                id: item.id,
                url: item.url,
                method: item.method,
                retries: item.retries,
                createdAt: item.createdAt
            }))
        };
    },
    
    // ===== تاخیر =====
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // ===== wrapper برای fetch با پشتیبانی آفلاین =====
    fetchWithOfflineSupport: async function(url, options = {}) {
        if (navigator.onLine) {
            try {
                const response = await fetch(url, options);
                if (!response.ok && options.offlineBackup) {
                    throw new Error('Request failed');
                }
                return response;
            } catch (error) {
                if (options.offlineBackup) {
                    return this.addToQueue(url, options);
                }
                throw error;
            }
        } else {
            return this.addToQueue(url, options);
        }
    },
    
    // ===== افزودن به صف با پاسخ شبیه‌سازی شده =====
    addToQueue: async function(url, options) {
        return new Promise((resolve, reject) => {
            this.add({
                url: url,
                method: options.method || 'POST',
                body: options.body,
                headers: options.headers,
                onSuccess: (data) => resolve({ ok: true, json: async () => data }),
                onError: (error) => reject(error)
            });
            
            // پاسخ موقت برای نمایش به کاربر
            resolve({
                ok: true,
                json: async () => ({ queued: true, message: 'درخواست در صف آفلاین قرار گرفت' })
            });
        });
    }
};

// مقداردهی اولیه
OfflineQueue.init();

window.OfflineQueue = OfflineQueue;
