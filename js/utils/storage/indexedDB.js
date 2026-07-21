 /* ============================================
   INDEXEDDB.JS - مدیریت IndexedDB
   ============================================ */

const IndexedDBManager = {
    // نام دیتابیس
    dbName: 'BookingPlatformDB',
    
    // نسخه دیتابیس
    dbVersion: 1,
    
    // اتصال دیتابیس
    db: null,
    
    // استورها
    stores: {
        bookings: { keyPath: 'id', indexes: ['date', 'status', 'businessId'] },
        users: { keyPath: 'id', indexes: ['phone', 'email'] },
        businesses: { keyPath: 'id', indexes: ['name', 'status'] },
        messages: { keyPath: 'id', indexes: ['userId', 'timestamp'] },
        cache: { keyPath: 'key', indexes: ['timestamp'] }
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('خطا در باز کردن IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB متصل شد');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    },
    
    // ===== ایجاد استورها =====
    createStores: function(db) {
        for (const [storeName, config] of Object.entries(this.stores)) {
            if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, { keyPath: config.keyPath });
                
                // ایجاد ایندکس‌ها
                if (config.indexes) {
                    config.indexes.forEach(index => {
                        store.createIndex(index, index, { unique: false });
                    });
                }
                
                console.log(`📁 استور ${storeName} ایجاد شد`);
            }
        }
    },
    
    // ===== افزودن داده =====
    add: function(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('دیتابیس متصل نیست'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // ===== دریافت داده =====
    get: function(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('دیتابیس متصل نیست'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // ===== دریافت همه داده‌ها =====
    getAll: function(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('دیتابیس متصل نیست'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // ===== به‌روزرسانی داده =====
    update: function(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('دیتابیس متصل نیست'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // ===== حذف داده =====
    delete: function(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('دیتابیس متصل نیست'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },
    
    // ===== جستجو با ایندکس =====
    getByIndex: function(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('دیتابیس متصل نیست'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // ===== جستجوی پیشرفته =====
    search: function(storeName, predicate) {
        return new Promise(async (resolve, reject) => {
            try {
                const allData = await this.getAll(storeName);
                const filtered = allData.filter(predicate);
                resolve(filtered);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // ===== حذف استور =====
    clearStore: function(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('دیتابیس متصل نیست'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },
    
    // ===== حذف دیتابیس =====
    deleteDatabase: function() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close();
            }
            
            const request = indexedDB.deleteDatabase(this.dbName);
            request.onsuccess = () => {
                this.db = null;
                resolve(true);
            };
            request.onerror = () => reject(request.error);
        });
    },
    
    // ===== کش کردن داده =====
    cacheData: function(key, data, ttlMinutes = 60) {
        const cacheItem = {
            key: key,
            data: data,
            timestamp: Date.now(),
            ttl: ttlMinutes * 60 * 1000
        };
        
        return this.add('cache', cacheItem);
    },
    
    // ===== دریافت داده کش شده =====
    getCachedData: async function(key, maxAgeMinutes = 60) {
        try {
            const cached = await this.get('cache', key);
            if (cached && Date.now() - cached.timestamp < (maxAgeMinutes * 60 * 1000)) {
                return cached.data;
            }
            return null;
        } catch (error) {
            return null;
        }
    },
    
    // ===== پاک کردن کش قدیمی =====
    cleanOldCache: async function() {
        const allCache = await this.getAll('cache');
        const now = Date.now();
        let cleaned = 0;
        
        for (const item of allCache) {
            if (now - item.timestamp > item.ttl) {
                await this.delete('cache', item.key);
                cleaned++;
            }
        }
        
        return cleaned;
    },
    
    // ===== بستن اتصال =====
    close: function() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
};

window.IndexedDBManager = IndexedDBManager;
