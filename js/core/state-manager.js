 /* ============================================
   STATE-MANAGER.JS - مدیریت State مرکزی
   ============================================ */

const StateManager = {
    // state اصلی
    _state: {
        // کاربر
        user: null,
        isLoggedIn: false,
        
        // نوبت‌ها
        bookings: [],
        currentBooking: null,
        
        // کسب‌وکارها
        businesses: [],
        currentBusiness: null,
        
        // تخفیف‌ها
        discounts: [],
        
        // بازار معکوس
        auctions: [],
        currentAuction: null,
        
        // اعلانات
        notifications: [],
        unreadCount: 0,
        
        // UI
        loading: false,
        sidebarOpen: false,
        theme: 'light',
        
        // آمار
        stats: {
            totalBookings: 0,
            totalBusinesses: 0,
            totalUsers: 0
        }
    },
    
    // شنونده‌ها
    _listeners: {},
    
    // ===== دریافت state =====
    get: function(key = null) {
        if (key) {
            return this._state[key];
        }
        return { ...this._state };
    },
    
    // ===== تنظیم state =====
    set: function(key, value, silent = false) {
        const oldValue = this._state[key];
        
        if (oldValue === value) return;
        
        this._state[key] = value;
        
        if (!silent) {
            this._notify(key, value, oldValue);
        }
        
        // ذخیره در localStorage برای بعضی کلیدها
        this._persist(key, value);
        
        return true;
    },
    
    // ===== به‌روزرسانی بخشی از state =====
    update: function(updates, silent = false) {
        const changedKeys = [];
        
        for (const [key, value] of Object.entries(updates)) {
            const oldValue = this._state[key];
            if (oldValue !== value) {
                this._state[key] = value;
                changedKeys.push(key);
                
                if (!silent) {
                    this._notify(key, value, oldValue);
                }
                
                this._persist(key, value);
            }
        }
        
        return changedKeys;
    },
    
    // ===== حذف کلید =====
    remove: function(key, silent = false) {
        if (this._state.hasOwnProperty(key)) {
            const oldValue = this._state[key];
            delete this._state[key];
            
            if (!silent) {
                this._notify(key, undefined, oldValue);
            }
        }
    },
    
    // ===== ریست state =====
    reset: function() {
        const oldState = { ...this._state };
        this._state = {
            user: null,
            isLoggedIn: false,
            bookings: [],
            currentBooking: null,
            businesses: [],
            currentBusiness: null,
            discounts: [],
            auctions: [],
            currentAuction: null,
            notifications: [],
            unreadCount: 0,
            loading: false,
            sidebarOpen: false,
            theme: 'light',
            stats: {
                totalBookings: 0,
                totalBusinesses: 0,
                totalUsers: 0
            }
        };
        
        this._notifyAll(oldState, this._state);
    },
    
    // ===== ثبت شنونده =====
    subscribe: function(key, callback, id = null) {
        if (!this._listeners[key]) {
            this._listeners[key] = [];
        }
        
        const listenerId = id || `listener_${Date.now()}_${Math.random()}`;
        this._listeners[key].push({
            id: listenerId,
            callback: callback
        });
        
        return listenerId;
    },
    
    // ===== حذف شنونده =====
    unsubscribe: function(key, id) {
        if (this._listeners[key]) {
            this._listeners[key] = this._listeners[key].filter(l => l.id !== id);
        }
    },
    
    // ===== اعلان تغییر =====
    _notify: function(key, newValue, oldValue) {
        if (this._listeners[key]) {
            this._listeners[key].forEach(listener => {
                try {
                    listener.callback(newValue, oldValue);
                } catch (error) {
                    console.error(`خطا در شنونده ${key}:`, error);
                }
            });
        }
        
        // ارسال رویداد عمومی
        App.emit('state:changed', { key, newValue, oldValue });
    },
    
    // ===== اعلان همه تغییرات =====
    _notifyAll: function(oldState, newState) {
        const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
        
        allKeys.forEach(key => {
            if (oldState[key] !== newState[key]) {
                this._notify(key, newState[key], oldState[key]);
            }
        });
    },
    
    // ===== ذخیره در localStorage =====
    _persist: function(key, value) {
        const persistKeys = ['user', 'isLoggedIn', 'theme'];
        
        if (persistKeys.includes(key)) {
            try {
                localStorage.setItem(`state_${key}`, JSON.stringify(value));
            } catch (e) {
                console.error('خطا در ذخیره localStorage:', e);
            }
        }
    },
    
    // ===== بارگذاری از localStorage =====
    loadPersisted: function() {
        const persistKeys = ['user', 'isLoggedIn', 'theme'];
        
        persistKeys.forEach(key => {
            const saved = localStorage.getItem(`state_${key}`);
            if (saved) {
                try {
                    this._state[key] = JSON.parse(saved);
                } catch (e) {
                    console.error(`خطا در بارگذاری ${key}:`, e);
                }
            }
        });
        
        console.log('💾 State از localStorage بارگذاری شد');
    },
    
    // ===== لاگین =====
    login: function(userData) {
        this.update({
            user: userData,
            isLoggedIn: true
        });
        
        // ذخیره توکن
        if (userData.token) {
            localStorage.setItem('auth_token', userData.token);
        }
        
        App.showToast(`خوش آمدید ${userData.name}`, 'success');
    },
    
    // ===== لاگ اوت =====
    logout: function() {
        this.update({
            user: null,
            isLoggedIn: false
        });
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('state_user');
        localStorage.removeItem('state_isLoggedIn');
        
        App.showToast('از حساب خود خارج شدید', 'info');
        
        // هدایت به صفحه اصلی
        if (window.Router) {
            Router.navigateTo('/');
        }
    },
    
    // ===== تنظیم لودینگ =====
    setLoading: function(loading) {
        this.set('loading', loading);
        
        // نمایش/مخفی کردن لودینگ سراسری
        const loader = document.getElementById('globalLoader');
        if (loader) {
            if (loading) {
                loader.classList.add('active');
            } else {
                loader.classList.remove('active');
            }
        }
    },
    
    // ===== اضافه کردن اعلان =====
    addNotification: function(notification) {
        const notifications = [...this._state.notifications];
        notifications.unshift({
            id: Date.now(),
            read: false,
            createdAt: new Date().toISOString(),
            ...notification
        });
        
        this.update({
            notifications: notifications,
            unreadCount: notifications.filter(n => !n.read).length
        });
    },
    
    // ===== علامت زدن اعلان به عنوان خوانده شده =====
    markNotificationAsRead: function(notificationId) {
        const notifications = this._state.notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
        );
        
        this.update({
            notifications: notifications,
            unreadCount: notifications.filter(n => !n.read).length
        });
    },
    
    // ===== علامت زدن همه اعلان‌ها =====
    markAllNotificationsAsRead: function() {
        const notifications = this._state.notifications.map(n => ({ ...n, read: true }));
        
        this.update({
            notifications: notifications,
            unreadCount: 0
        });
    }
};

// بارگذاری داده‌های ذخیره شده
StateManager.loadPersisted();

window.StateManager = StateManager;
