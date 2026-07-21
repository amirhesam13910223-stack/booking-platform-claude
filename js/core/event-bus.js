 /* ============================================
   EVENT-BUS.JS - ارتباط بین ماژول‌ها
   ============================================ */

const EventBus = {
    // رویدادها و شنونده‌ها
    _events: {},
    
    // تاریخچه رویدادها (برای دیباگ)
    _history: [],
    _maxHistory: 100,
    
    // وضعیت دیباگ
    _debug: true,
    
    // ===== ثبت شنونده =====
    on: function(event, callback, once = false) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        
        const listener = {
            id: this._generateId(),
            callback: callback,
            once: once
        };
        
        this._events[event].push(listener);
        
        if (this._debug) {
            console.log(`🎧 شنونده برای رویداد "${event}" ثبت شد (ID: ${listener.id})`);
        }
        
        return listener.id;
    },
    
    // ===== ثبت شنونده یکبارمصرف =====
    once: function(event, callback) {
        return this.on(event, callback, true);
    },
    
    // ===== حذف شنونده =====
    off: function(event, listenerId) {
        if (!this._events[event]) return false;
        
        const initialLength = this._events[event].length;
        this._events[event] = this._events[event].filter(l => l.id !== listenerId);
        
        if (this._debug && initialLength !== this._events[event].length) {
            console.log(`🔇 شنونده ${listenerId} از رویداد "${event}" حذف شد`);
        }
        
        return initialLength !== this._events[event].length;
    },
    
    // ===== حذف همه شنونده‌های یک رویداد =====
    offAll: function(event) {
        if (event) {
            delete this._events[event];
            if (this._debug) console.log(`🗑️ همه شنونده‌های رویداد "${event}" حذف شدند`);
        } else {
            this._events = {};
            if (this._debug) console.log(`🗑️ همه شنونده‌ها حذف شدند`);
        }
    },
    
    // ===== انتشار رویداد =====
    emit: function(event, data = {}) {
        if (this._debug) {
            this._addToHistory(event, data);
            console.log(`📡 انتشار رویداد "${event}"`, data);
        }
        
        if (!this._events[event]) {
            if (this._debug) console.warn(`⚠️ رویداد "${event}" شنونده‌ای ندارد`);
            return false;
        }
        
        const listeners = [...this._events[event]];
        let executedCount = 0;
        
        listeners.forEach(listener => {
            try {
                listener.callback(data);
                executedCount++;
                
                // حذف شنونده‌های یکبارمصرف
                if (listener.once) {
                    this.off(event, listener.id);
                }
            } catch (error) {
                console.error(`❌ خطا در اجرای شنونده رویداد "${event}":`, error);
            }
        });
        
        if (this._debug) {
            console.log(`✅ رویداد "${event}" به ${executedCount} شنونده ارسال شد`);
        }
        
        return true;
    },
    
    // ===== انتشار رویداد ناهمگام =====
    emitAsync: async function(event, data = {}) {
        if (this._debug) {
            this._addToHistory(event, data);
            console.log(`📡 انتشار ناهمگام رویداد "${event}"`, data);
        }
        
        if (!this._events[event]) {
            if (this._debug) console.warn(`⚠️ رویداد "${event}" شنونده‌ای ندارد`);
            return [];
        }
        
        const listeners = [...this._events[event]];
        const results = [];
        
        for (const listener of listeners) {
            try {
                const result = await listener.callback(data);
                results.push({ success: true, result, listenerId: listener.id });
                
                if (listener.once) {
                    this.off(event, listener.id);
                }
            } catch (error) {
                results.push({ success: false, error, listenerId: listener.id });
                console.error(`❌ خطا در اجرای ناهمگام رویداد "${event}":`, error);
            }
        }
        
        return results;
    },
    
    // ===== بررسی وجود شنونده =====
    hasListeners: function(event) {
        return this._events[event] && this._events[event].length > 0;
    },
    
    // ===== تعداد شنونده‌های یک رویداد =====
    listenerCount: function(event) {
        return this._events[event] ? this._events[event].length : 0;
    },
    
    // ===== دریافت همه رویدادها =====
    getEvents: function() {
        return Object.keys(this._events);
    },
    
    // ===== دریافت تاریخچه =====
    getHistory: function() {
        return [...this._history];
    },
    
    // ===== پاک کردن تاریخچه =====
    clearHistory: function() {
        this._history = [];
        if (this._debug) console.log('🧹 تاریخچه رویدادها پاک شد');
    },
    
    // ===== فعال/غیرفعال کردن دیباگ =====
    setDebug: function(enabled) {
        this._debug = enabled;
        console.log(`🐛 دیباگ EventBus ${enabled ? 'فعال' : 'غیرفعال'} شد`);
    },
    
    // ===== اضافه به تاریخچه =====
    _addToHistory: function(event, data) {
        this._history.unshift({
            event,
            data,
            timestamp: new Date().toISOString()
        });
        
        if (this._history.length > this._maxHistory) {
            this._history.pop();
        }
    },
    
    // ===== تولید ID یکتا =====
    _generateId: function() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};

// ===== رویدادهای از پیش تعریف شده سیستم =====
const SystemEvents = {
    // رویدادهای برنامه
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',
    
    // رویدادهای احراز هویت
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_CHECKED: 'auth:checked',
    
    // رویدادهای نوبت
    BOOKING_CREATED: 'booking:created',
    BOOKING_CANCELLED: 'booking:cancelled',
    BOOKING_UPDATED: 'booking:updated',
    
    // رویدادهای پرداخت
    PAYMENT_SUCCESS: 'payment:success',
    PAYMENT_FAILED: 'payment:failed',
    
    // رویدادهای تخفیف
    DISCOUNT_APPLIED: 'discount:applied',
    DISCOUNT_REMOVED: 'discount:removed',
    
    // رویدادهای بازار معکوس
    AUCTION_STARTED: 'auction:started',
    AUCTION_ENDED: 'auction:ended',
    BID_PLACED: 'bid:placed',
    
    // رویدادهای UI
    MODAL_OPENED: 'modal:opened',
    MODAL_CLOSED: 'modal:closed',
    TOAST_SHOWN: 'toast:shown',
    THEME_CHANGED: 'theme:changed',
    
    // رویدادهای state
    STATE_CHANGED: 'state:changed',
    
    // رویدادهای route
    ROUTE_CHANGED: 'route:changed'
};

window.EventBus = EventBus;
window.SystemEvents = SystemEvents;
