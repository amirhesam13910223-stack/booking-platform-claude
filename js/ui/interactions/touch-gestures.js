 /* ============================================
   TOUCH-GESTURES.JS - ژست‌های لمسی
   ============================================ */

const TouchGestures = {
    // تنظیمات
    config: {
        swipeThreshold: 50,
        tapThreshold: 10,
        longPressThreshold: 500,
        doubleTapDelay: 300
    },
    
    // وضعیت لمس
    touchStart: null,
    touchEnd: null,
    lastTap: 0,
    longPressTimer: null,
    
    // هندلرها
    handlers: {
        swipe: [],
        tap: [],
        doubleTap: [],
        longPress: [],
        pinch: []
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachGlobalEvents();
        console.log('👆 Touch Gestures راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادهای لمسی =====
    attachGlobalEvents: function() {
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    },
    
    // ===== هندلر شروع لمس =====
    handleTouchStart: function(e) {
        const touch = e.touches[0];
        this.touchStart = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
        
        // شروع تایمر لمس طولانی
        this.longPressTimer = setTimeout(() => {
            this.trigger('longPress', e, this.touchStart);
        }, this.config.longPressThreshold);
        
        // تشخیص چند لمس برای پینچ
        if (e.touches.length === 2) {
            this.handlePinchStart(e);
        }
    },
    
    // ===== هندلر حرکت لمس =====
    handleTouchMove: function(e) {
        // لغو لمس طولانی در صورت حرکت
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (e.touches.length === 2) {
            this.handlePinchMove(e);
        }
    },
    
    // ===== هندلر پایان لمس =====
    handleTouchEnd: function(e) {
        // لغو لمس طولانی
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (!this.touchStart) return;
        
        this.touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
            time: Date.now()
        };
        
        this.detectGestures(e);
        
        this.touchStart = null;
        this.touchEnd = null;
    },
    
    // ===== تشخیص ژست‌ها =====
    detectGestures: function(e) {
        const deltaX = this.touchEnd.x - this.touchStart.x;
        const deltaY = this.touchEnd.y - this.touchStart.y;
        const deltaTime = this.touchEnd.time - this.touchStart.time;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // تشخیص سوییپ
        if (distance > this.config.swipeThreshold && deltaTime < 500) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) {
                    this.trigger('swipeRight', e);
                } else {
                    this.trigger('swipeLeft', e);
                }
            } else {
                if (deltaY > 0) {
                    this.trigger('swipeDown', e);
                } else {
                    this.trigger('swipeUp', e);
                }
            }
        }
        
        // تشخیص تپ
        if (distance < this.config.tapThreshold && deltaTime < 300) {
            this.trigger('tap', e);
            this.detectDoubleTap(e);
        }
    },
    
    // ===== تشخیص دوبار تپ =====
    detectDoubleTap: function(e) {
        const now = Date.now();
        if (now - this.lastTap < this.config.doubleTapDelay) {
            this.trigger('doubleTap', e);
        }
        this.lastTap = now;
    },
    
    // ===== تشخیص پینچ =====
    handlePinchStart: function(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        this.pinchStart = {
            distance: this.getDistance(touch1, touch2),
            scale: 1
        };
    },
    
    // ===== تشخیص حرکت پینچ =====
    handlePinchMove: function(e) {
        if (!this.pinchStart) return;
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = this.getDistance(touch1, touch2);
        const scale = currentDistance / this.pinchStart.distance;
        
        this.trigger('pinch', e, { scale: scale });
        this.pinchStart.scale = scale;
    },
    
    // ===== محاسبه فاصله بین دو نقطه =====
    getDistance: function(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // ===== ثبت هندلر =====
    on: function(gesture, callback) {
        if (this.handlers[gesture]) {
            this.handlers[gesture].push(callback);
        }
        return this;
    },
    
    // ===== حذف هندلر =====
    off: function(gesture, callback) {
        if (this.handlers[gesture]) {
            const index = this.handlers[gesture].indexOf(callback);
            if (index !== -1) this.handlers[gesture].splice(index, 1);
        }
        return this;
    },
    
    // ===== اجرای هندلر =====
    trigger: function(gesture, event, data = {}) {
        if (this.handlers[gesture]) {
            this.handlers[gesture].forEach(handler => handler(event, data));
        }
    },
    
    // ===== فعال‌سازی سوییپ روی عنصر =====
    enableSwipe: function(element, options = {}) {
        const {
            onSwipeLeft = null,
            onSwipeRight = null,
            onSwipeUp = null,
            onSwipeDown = null
        } = options;
        
        const touchStart = { x: 0, y: 0 };
        
        element.addEventListener('touchstart', (e) => {
            touchStart.x = e.touches[0].clientX;
            touchStart.y = e.touches[0].clientY;
        });
        
        element.addEventListener('touchend', (e) => {
            const touchEnd = e.changedTouches[0];
            const deltaX = touchEnd.clientX - touchStart.x;
            const deltaY = touchEnd.clientY - touchStart.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > this.config.swipeThreshold) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 0 && onSwipeRight) onSwipeRight();
                    if (deltaX < 0 && onSwipeLeft) onSwipeLeft();
                } else {
                    if (deltaY > 0 && onSwipeDown) onSwipeDown();
                    if (deltaY < 0 && onSwipeUp) onSwipeUp();
                }
            }
        });
        
        return element;
    },
    
    // ===== فعال‌سازی کشیدن برای بستن =====
    enableSwipeToClose: function(element, onClose) {
        let startX = 0;
        let currentX = 0;
        
        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        element.addEventListener('touchmove', (e) => {
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            if (deltaX > 0) {
                element.style.transform = `translateX(${deltaX}px)`;
                element.style.opacity = 1 - (deltaX / 200);
            }
        });
        
        element.addEventListener('touchend', () => {
            const deltaX = currentX - startX;
            if (deltaX > 100) {
                element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                element.style.transform = 'translateX(100%)';
                element.style.opacity = '0';
                setTimeout(() => {
                    if (onClose) onClose();
                    element.remove();
                }, 300);
            } else {
                element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                element.style.transform = 'translateX(0)';
                element.style.opacity = '1';
                setTimeout(() => {
                    element.style.transition = '';
                }, 300);
            }
        });
        
        return element;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    TouchGestures.init();
});

window.TouchGestures = TouchGestures;
