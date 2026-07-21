/* ============================================
   SYNC-MANAGER.JS - مدیریت همگام‌سازی داده‌ها
   ============================================ */

   const SyncManager = {
    // تنظیمات
    config: {
        syncInterval: 300000, // 5 دقیقه
        batchSize: 50,
        conflictResolution: 'server_wins' // server_wins, client_wins, merge
    },
    
    // داده‌های محلی
    localData: {
        bookings: [],
        users: [],
        businesses: []
    },
    
    // تایمر همگام‌سازی
    syncTimer: null,
    
    // وضعیت همگام‌سازی
    isSyncing: false,
    lastSyncTime: null,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadLocalData();
        this.startAutoSync();
        this.setupNetworkListeners();
        console.log('🔄 Sync Manager راه‌اندازی شد');
    },
    
    // ===== بارگذاری داده‌های محلی =====
    loadLocalData: function() {
        const saved = localStorage.getItem('sync_local_data');
        if (saved) {
            try {
                this.localData = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره داده‌های محلی =====
    saveLocalData: function() {
        localStorage.setItem('sync_local_data', JSON.stringify(this.localData));
    },
    
    // ===== شروع همگام‌سازی خودکار =====
    startAutoSync: function() {
        if (this.syncTimer) clearInterval(this.syncTimer);
        this.syncTimer = setInterval(() => {
            if (navigator.onLine) {
                this.sync();
            }
        }, this.config.syncInterval);
    },
    
    // ===== توقف همگام‌سازی خودکار =====
    stopAutoSync: function() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    },
    
    // ===== تنظیم شنونده‌های شبکه =====
    setupNetworkListeners: function() {
        window.addEventListener('online', () => {
            console.log('🌐 آنلاین شد، شروع همگام‌سازی...');
            this.sync();
        });
    },
    
    // ===== همگام‌سازی اصلی =====
    sync: async function() {
        if (!navigator.onLine) {
            console.log('📴 دستگاه آفلاین است، همگام‌سازی انجام نمی‌شود');
            return false;
        }
        
        if (this.isSyncing) {
            console.log('⏳ همگام‌سازی در حال انجام است');
            return false;
        }
        
        this.isSyncing = true;
        console.log('🔄 شروع همگام‌سازی...');
        
        try {
            // همگام‌سازی داده‌های محلی با سرور
            await this.syncBookings();
            await this.syncUsers();
            await this.syncBusinesses();
            
            this.lastSyncTime = Date.now();
            console.log('✅ همگام‌سازی با موفقیت انجام شد');
            
            // ارسال رویداد
            App.emit('sync:completed', { timestamp: this.lastSyncTime });
            
            return true;
        } catch (error) {
            console.error('❌ خطا در همگام‌سازی:', error);
            App.emit('sync:error', { error });
            return false;
        } finally {
            this.isSyncing = false;
        }
    },
    
    // ===== همگام‌سازی نوبت‌ها =====
    syncBookings: async function() {
        try {
            // دریافت نوبت‌های جدید از سرور
            const response = await APIClient.get('/bookings/sync', {
                lastSync: this.lastSyncTime
            });
            
            if (response.data && response.data.bookings) {
                // حل تعارض
                const resolvedBookings = this.resolveConflicts(
                    this.localData.bookings,
                    response.data.bookings,
                    'bookings'
                );
                
                this.localData.bookings = resolvedBookings;
                this.saveLocalData();
                
                // ذخیره در localStorage اصلی
                localStorage.setItem('user_bookings', JSON.stringify(resolvedBookings));
            }
        } catch (error) {
            console.error('خطا در همگام‌سازی نوبت‌ها:', error);
        }
    },
    
    // ===== همگام‌سازی کاربران =====
    syncUsers: async function() {
        try {
            const response = await APIClient.get('/users/sync', {
                lastSync: this.lastSyncTime
            });
            
            if (response.data && response.data.users) {
                const resolvedUsers = this.resolveConflicts(
                    this.localData.users,
                    response.data.users,
                    'users'
                );
                
                this.localData.users = resolvedUsers;
                this.saveLocalData();
                
                localStorage.setItem('registered_users', JSON.stringify(resolvedUsers));
            }
        } catch (error) {
            console.error('خطا در همگام‌سازی کاربران:', error);
        }
    },
    
    // ===== همگام‌سازی کسب‌وکارها =====
    syncBusinesses: async function() {
        try {
            const response = await APIClient.get('/businesses/sync', {
                lastSync: this.lastSyncTime
            });
            
            if (response.data && response.data.businesses) {
                const resolvedBusinesses = this.resolveConflicts(
                    this.localData.businesses,
                    response.data.businesses,
                    'businesses'
                );
                
                this.localData.businesses = resolvedBusinesses;
                this.saveLocalData();
                
                localStorage.setItem('businesses_list', JSON.stringify(resolvedBusinesses));
            }
        } catch (error) {
            console.error('خطا در همگام‌سازی کسب‌وکارها:', error);
        }
    },
    
    // ===== حل تعارض =====
    resolveConflicts: function(localItems, serverItems, type) {
        const merged = [...serverItems];
        
        for (const localItem of localItems) {
            const existingIndex = merged.findIndex(item => item.id === localItem.id);
            
            if (existingIndex === -1) {
                merged.push(localItem);
            } else {
                // حل تعارض بر اساس استراتژی
                switch(this.config.conflictResolution) {
                    case 'server_wins':
                        // حفظ داده سرور (همینطور که هست)
                        break;
                    case 'client_wins':
                        merged[existingIndex] = localItem;
                        break;
                    case 'merge':
                        merged[existingIndex] = { ...merged[existingIndex], ...localItem };
                        break;
                }
            }
        }
        
        return merged;
    },
    
    // ===== افزودن داده محلی =====
    addLocalData: function(type, data) {
        if (this.localData[type]) {
            this.localData[type].push(data);
            this.saveLocalData();
            
            // اگر آنلاین هستیم، بلافاصله همگام‌سازی کن
            if (navigator.onLine) {
                this.sync();
            }
        }
    },
    
    // ===== به‌روزرسانی داده محلی =====
    updateLocalData: function(type, id, updates) {
        if (this.localData[type]) {
            const index = this.localData[type].findIndex(item => item.id === id);
            if (index !== -1) {
                this.localData[type][index] = { ...this.localData[type][index], ...updates };
                this.saveLocalData();
                
                if (navigator.onLine) {
                    this.sync();
                }
                return true;
            }
        }
        return false;
    },
    
    // ===== حذف داده محلی =====
    deleteLocalData: function(type, id) {
        if (this.localData[type]) {
            const index = this.localData[type].findIndex(item => item.id === id);
            if (index !== -1) {
                this.localData[type].splice(index, 1);
                this.saveLocalData();
                
                if (navigator.onLine) {
                    this.sync();
                }
                return true;
            }
        }
        return false;
    },
    
    // ===== دریافت وضعیت همگام‌سازی =====
    getStatus: function() {
        return {
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            lastSyncDate: this.lastSyncTime ? new Date(this.lastSyncTime).toLocaleString() : 'هرگز',
            localDataSize: {
                bookings: this.localData.bookings.length,
                users: this.localData.users.length,
                businesses: this.localData.businesses.length
            },
            conflictResolution: this.config.conflictResolution,
            syncInterval: this.config.syncInterval / 1000 + ' ثانیه'
        };
    },
    
    // ===== تنظیم استراتژی حل تعارض =====
    setConflictResolution: function(strategy) {
        if (['server_wins', 'client_wins', 'merge'].includes(strategy)) {
            this.config.conflictResolution = strategy;
            console.log(`استراتژی حل تعارض به ${strategy} تغییر یافت`);
        }
    },
    
    // ===== همگام‌سازی دستی =====
    manualSync: async function() {
        return await this.sync();
    }
};

// مقداردهی اولیه
SyncManager.init();

window.SyncManager = SyncManager; 
