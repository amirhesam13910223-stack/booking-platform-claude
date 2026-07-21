 /* ============================================
   NOTIFICATION-BELL.JS - ویجت زنگ اعلانات
   ============================================ */

const NotificationBellWidget = {
    // ===== ایجاد ویجت زنگ اعلان =====
    create: function(options = {}) {
        const {
            onNotificationClick = null,
            onMarkAllRead = null,
            position = 'relative'
        } = options;
        
        const widget = document.createElement('div');
        widget.className = `notification-bell-widget ${position}`;
        
        // نشانگر تعداد اعلانات
        const badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.textContent = '0';
        badge.style.display = 'none';
        
        // دکمه زنگ
        const bellBtn = document.createElement('button');
        bellBtn.className = 'bell-button';
        bellBtn.innerHTML = '🔔';
        bellBtn.appendChild(badge);
        
        // پنل اعلانات
        const panel = document.createElement('div');
        panel.className = 'notification-panel';
        panel.style.display = 'none';
        
        panel.innerHTML = `
            <div class="notification-header">
                <h4>اعلانات</h4>
                <button class="mark-all-read">خواندن همه</button>
            </div>
            <div class="notification-list">
                <div class="notification-empty">هیچ اعلانی وجود ندارد</div>
            </div>
        `;
        
        widget.appendChild(bellBtn);
        widget.appendChild(panel);
        
        // اتصال رویدادها
        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
        });
        
        document.addEventListener('click', () => {
            panel.style.display = 'none';
        });
        
        panel.querySelector('.mark-all-read')?.addEventListener('click', () => {
            if (onMarkAllRead) onMarkAllRead();
            this.clearAll();
        });
        
        this.widget = widget;
        this.badge = badge;
        this.panel = panel;
        this.notifications = [];
        this.onNotificationClick = onNotificationClick;
        
        return widget;
    },
    
    // ===== افزودن اعلان =====
    addNotification: function(notification) {
        const {
            id = Date.now(),
            title,
            message,
            type = 'info',
            icon = null,
            link = null,
            timestamp = new Date()
        } = notification;
        
        this.notifications.unshift({ id, title, message, type, icon, link, timestamp });
        this.updateBadge();
        this.renderNotifications();
        
        // نمایش خودکار پنل برای اعلان جدید
        if (this.panel) {
            this.panel.style.display = 'block';
            setTimeout(() => {
                this.panel.style.display = 'none';
            }, 5000);
        }
        
        return id;
    },
    
    // ===== رندر اعلان‌ها =====
    renderNotifications: function() {
        if (!this.panel) return;
        
        const list = this.panel.querySelector('.notification-list');
        if (!list) return;
        
        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="notification-empty">هیچ اعلانی وجود ندارد</div>';
            return;
        }
        
        list.innerHTML = this.notifications.map(notif => `
            <div class="notification-item ${notif.type}" data-id="${notif.id}">
                <div class="notification-icon">${notif.icon || this.getIconByType(notif.type)}</div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${this.formatTime(notif.timestamp)}</div>
                </div>
                <button class="notification-close" data-id="${notif.id}">×</button>
            </div>
        `).join('');
        
        // اتصال رویدادها
        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('notification-close')) return;
                const id = parseInt(item.dataset.id);
                const notification = this.notifications.find(n => n.id === id);
                if (this.onNotificationClick) {
                    this.onNotificationClick(notification);
                }
                this.removeNotification(id);
            });
        });
        
        list.querySelectorAll('.notification-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.removeNotification(id);
            });
        });
    },
    
    // ===== حذف اعلان =====
    removeNotification: function(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notifications.splice(index, 1);
            this.updateBadge();
            this.renderNotifications();
        }
    },
    
    // ===== پاک کردن همه =====
    clearAll: function() {
        this.notifications = [];
        this.updateBadge();
        this.renderNotifications();
    },
    
    // ===== به‌روزرسانی نشانگر =====
    updateBadge: function() {
        const count = this.notifications.length;
        if (count > 0) {
            this.badge.textContent = count > 99 ? '99+' : count;
            this.badge.style.display = 'flex';
        } else {
            this.badge.style.display = 'none';
        }
    },
    
    // ===== دریافت آیکون بر اساس نوع =====
    getIconByType: function(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            booking: '📅',
            payment: '💰',
            discount: '🎁'
        };
        return icons[type] || '📢';
    },
    
    // ===== فرمت زمان =====
    formatTime: function(timestamp) {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 1) return 'لحظاتی پیش';
        if (minutes < 60) return `${minutes} دقیقه پیش`;
        if (hours < 24) return `${hours} ساعت پیش`;
        return `${days} روز پیش`;
    }
};

// استایل‌های ویجت زنگ اعلان
const notificationBellStyles = `
<style>
.notification-bell-widget {
    position: relative;
    display: inline-block;
}
.notification-bell-widget.relative {
    position: relative;
}
.bell-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    position: relative;
    padding: 0.25rem;
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
}
.bell-button:hover {
    background: var(--bg-secondary);
}
.notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: var(--color-danger);
    color: white;
    font-size: 0.65rem;
    min-width: 18px;
    height: 18px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
}
.notification-panel {
    position: absolute;
    top: 100%;
    right: 0;
    width: 320px;
    max-height: 400px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    overflow: hidden;
}
.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
}
.notification-header h4 {
    margin: 0;
}
.mark-all-read {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 0.75rem;
    cursor: pointer;
}
.notification-list {
    max-height: 350px;
    overflow-y: auto;
}
.notification-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: all var(--transition-fast);
}
.notification-item:hover {
    background: var(--bg-secondary);
}
.notification-icon {
    font-size: 1.25rem;
}
.notification-content {
    flex: 1;
}
.notification-title {
    font-weight: bold;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
}
.notification-message {
    font-size: 0.75rem;
    color: var(--text-secondary);
}
.notification-time {
    font-size: 0.65rem;
    color: var(--text-tertiary);
    margin-top: 0.25rem;
}
.notification-close {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    color: var(--text-tertiary);
    padding: 0.25rem;
}
.notification-empty {
    text-align: center;
    padding: 2rem;
    color: var(--text-tertiary);
}
</style>
`;

if (!document.querySelector('#notification-bell-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'notification-bell-styles';
    styleSheet.textContent = notificationBellStyles;
    document.head.appendChild(styleSheet);
}

window.NotificationBellWidget = NotificationBellWidget;
