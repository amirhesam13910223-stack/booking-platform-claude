 /* ============================================
   WEBSOCKET.JS - مدیریت اتصال WebSocket
   ============================================ */

const WebSocketManager = {
    // اتصال فعلی
    socket: null,
    
    // وضعیت اتصال
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    
    // آدرس سرور
    serverUrl: null,
    
    // هندلرها
    handlers: {
        onOpen: [],
        onClose: [],
        onError: [],
        onMessage: {}
    },
    
    // صف پیام‌های ارسال نشده
    messageQueue: [],
    
    // ===== مقداردهی اولیه =====
    init: function(serverUrl) {
        this.serverUrl = serverUrl;
        this.connect();
    },
    
    // ===== اتصال =====
    connect: function() {
        try {
            this.socket = new WebSocket(this.serverUrl);
            
            this.socket.onopen = () => this.handleOpen();
            this.socket.onclose = (event) => this.handleClose(event);
            this.socket.onerror = (error) => this.handleError(error);
            this.socket.onmessage = (event) => this.handleMessage(event);
            
        } catch (error) {
            console.error('خطا در اتصال WebSocket:', error);
            this.attemptReconnect();
        }
    },
    
    // ===== قطع اتصال =====
    disconnect: function() {
        if (this.socket && this.isConnected) {
            this.socket.close();
        }
    },
    
    // ===== هندلر اتصال =====
    handleOpen: function() {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ WebSocket متصل شد');
        
        // ارسال پیام‌های منتظر
        this.flushMessageQueue();
        
        // اجرای هندلرها
        this.handlers.onOpen.forEach(handler => handler());
    },
    
    // ===== هندلر قطع اتصال =====
    handleClose: function(event) {
        this.isConnected = false;
        console.log('🔌 WebSocket قطع شد', event.code, event.reason);
        
        this.handlers.onClose.forEach(handler => handler(event));
        
        if (!event.wasClean) {
            this.attemptReconnect();
        }
    },
    
    // ===== هندلر خطا =====
    handleError: function(error) {
        console.error('❌ خطای WebSocket:', error);
        this.handlers.onError.forEach(handler => handler(error));
    },
    
    // ===== هندلر پیام =====
    handleMessage: function(event) {
        try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;
            
            if (type && this.handlers.onMessage[type]) {
                this.handlers.onMessage[type].forEach(handler => handler(payload));
            }
            
            // هندلر عمومی
            if (this.handlers.onMessage['*']) {
                this.handlers.onMessage['*'].forEach(handler => handler(data));
            }
            
        } catch (error) {
            console.error('خطا در پردازش پیام WebSocket:', error);
        }
    },
    
    // ===== تلاش مجدد برای اتصال =====
    attemptReconnect: function() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('حداکثر تلاش برای اتصال مجدد رسیده است');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`🔄 تلاش برای اتصال مجدد ${this.reconnectAttempts}/${this.maxReconnectAttempts} در ${delay}ms`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    },
    
    // ===== ارسال پیام =====
    send: function(type, payload) {
        const message = JSON.stringify({ type, payload });
        
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
            return true;
        } else {
            this.messageQueue.push(message);
            return false;
        }
    },
    
    // ===== ارسال پیام‌های منتظر =====
    flushMessageQueue: function() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.socket.send(message);
        }
    },
    
    // ===== ثبت هندلر =====
    onOpen: function(handler) {
        this.handlers.onOpen.push(handler);
    },
    
    onClose: function(handler) {
        this.handlers.onClose.push(handler);
    },
    
    onError: function(handler) {
        this.handlers.onError.push(handler);
    },
    
    onMessage: function(type, handler) {
        if (!this.handlers.onMessage[type]) {
            this.handlers.onMessage[type] = [];
        }
        this.handlers.onMessage[type].push(handler);
    },
    
    // ===== حذف هندلر =====
    offOpen: function(handler) {
        const index = this.handlers.onOpen.indexOf(handler);
        if (index !== -1) this.handlers.onOpen.splice(index, 1);
    },
    
    offClose: function(handler) {
        const index = this.handlers.onClose.indexOf(handler);
        if (index !== -1) this.handlers.onClose.splice(index, 1);
    },
    
    offError: function(handler) {
        const index = this.handlers.onError.indexOf(handler);
        if (index !== -1) this.handlers.onError.splice(index, 1);
    },
    
    offMessage: function(type, handler) {
        if (this.handlers.onMessage[type]) {
            const index = this.handlers.onMessage[type].indexOf(handler);
            if (index !== -1) this.handlers.onMessage[type].splice(index, 1);
        }
    },
    
    // ===== دریافت وضعیت =====
    getStatus: function() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            queueSize: this.messageQueue.length
        };
    },
    
    // ===== پیام‌های از پیش تعریف شده =====
    ping: function() {
        return this.send('ping', { timestamp: Date.now() });
    },
    
    joinRoom: function(roomId) {
        return this.send('join', { room: roomId });
    },
    
    leaveRoom: function(roomId) {
        return this.send('leave', { room: roomId });
    },
    
    sendToRoom: function(roomId, event, data) {
        return this.send('room_message', { room: roomId, event, data });
    }
};

window.WebSocketManager = WebSocketManager;
