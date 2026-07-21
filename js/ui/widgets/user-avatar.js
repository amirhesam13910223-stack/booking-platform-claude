 /* ============================================
   USER-AVATAR.JS - ویجت آواتار کاربر
   ============================================ */

const UserAvatarWidget = {
    // ===== ایجاد آواتار =====
    create: function(user, options = {}) {
        const {
            size = 'md', // sm, md, lg, xl
            shape = 'circle', // circle, square
            showName = false,
            showStatus = false,
            onClick = null,
            className = ''
        } = options;
        
        const avatar = document.createElement('div');
        avatar.className = `user-avatar-widget ${size} ${shape} ${className}`;
        
        // محتوای آواتار
        const content = this.getAvatarContent(user, size);
        avatar.innerHTML = content;
        
        // نام کاربر
        if (showName) {
            const nameSpan = document.createElement('span');
            nameSpan.className = 'user-avatar-name';
            nameSpan.textContent = user.name;
            avatar.appendChild(nameSpan);
        }
        
        // وضعیت آنلاین
        if (showStatus) {
            const statusSpan = document.createElement('span');
            statusSpan.className = `user-status ${user.isOnline ? 'online' : 'offline'}`;
            avatar.appendChild(statusSpan);
        }
        
        if (onClick) {
            avatar.style.cursor = 'pointer';
            avatar.addEventListener('click', onClick);
        }
        
        return avatar;
    },
    
    // ===== دریافت محتوای آواتار =====
    getAvatarContent: function(user, size) {
        if (user.avatar) {
            return `<img src="${user.avatar}" alt="${user.name}" class="avatar-image">`;
        } else {
            const initials = this.getInitials(user.name);
            const bgColor = this.getColorFromName(user.name);
            return `<div class="avatar-initials" style="background: ${bgColor}">${initials}</div>`;
        }
    },
    
    // ===== دریافت حروف اول =====
    getInitials: function(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0);
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    },
    
    // ===== دریافت رنگ از نام =====
    getColorFromName: function(name) {
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash) + name.charCodeAt(i);
            hash |= 0;
        }
        
        return colors[Math.abs(hash) % colors.length];
    },
    
    // ===== ایجاد آواتار گروهی =====
    createGroup: function(users, options = {}) {
        const {
            size = 'md',
            maxDisplay = 4,
            showCount = true
        } = options;
        
        const container = document.createElement('div');
        container.className = `user-avatar-group ${size}`;
        
        const displayUsers = users.slice(0, maxDisplay);
        const remaining = users.length - maxDisplay;
        
        displayUsers.forEach((user, index) => {
            const avatar = this.create(user, { size, shape: 'circle', className: 'group-avatar' });
            avatar.style.marginLeft = index > 0 ? '-8px' : '0';
            container.appendChild(avatar);
        });
        
        if (remaining > 0 && showCount) {
            const countBadge = document.createElement('div');
            countBadge.className = 'avatar-count';
            countBadge.textContent = `+${remaining}`;
            container.appendChild(countBadge);
        }
        
        return container;
    },
    
    // ===== ایجاد آواتار با منوی پروفایل =====
    createWithMenu: function(user, options = {}) {
        const {
            menuItems = [
                { label: 'پروفایل', action: 'profile', icon: '👤' },
                { label: 'نوبت‌های من', action: 'bookings', icon: '📅' },
                { label: 'کیف پول', action: 'wallet', icon: '💰' },
                { divider: true },
                { label: 'خروج', action: 'logout', icon: '🚪', danger: true }
            ],
            onAction = null
        } = options;
        
        const container = document.createElement('div');
        container.className = 'user-avatar-menu';
        
        const avatar = this.create(user, { showName: true });
        avatar.classList.add('avatar-trigger');
        
        const menu = document.createElement('div');
        menu.className = 'avatar-menu-dropdown';
        menu.style.display = 'none';
        
        menuItems.forEach(item => {
            if (item.divider) {
                const hr = document.createElement('hr');
                hr.className = 'menu-divider';
                menu.appendChild(hr);
            } else {
                const menuItem = document.createElement('button');
                menuItem.className = `menu-item ${item.danger ? 'danger' : ''}`;
                menuItem.innerHTML = `
                    <span class="menu-icon">${item.icon}</span>
                    <span>${item.label}</span>
                `;
                menuItem.addEventListener('click', () => {
                    if (onAction) onAction(item.action);
                    menu.style.display = 'none';
                });
                menu.appendChild(menuItem);
            }
        });
        
        container.appendChild(avatar);
        container.appendChild(menu);
        
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
        });
        
        document.addEventListener('click', () => {
            menu.style.display = 'none';
        });
        
        return container;
    }
};

// استایل‌های آواتار کاربر
const userAvatarStyles = `
<style>
.user-avatar-widget {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.user-avatar-widget.sm .avatar-image,
.user-avatar-widget.sm .avatar-initials {
    width: 28px;
    height: 28px;
    font-size: 0.7rem;
}
.user-avatar-widget.md .avatar-image,
.user-avatar-widget.md .avatar-initials {
    width: 40px;
    height: 40px;
    font-size: 1rem;
}
.user-avatar-widget.lg .avatar-image,
.user-avatar-widget.lg .avatar-initials {
    width: 56px;
    height: 56px;
    font-size: 1.25rem;
}
.user-avatar-widget.xl .avatar-image,
.user-avatar-widget.xl .avatar-initials {
    width: 80px;
    height: 80px;
    font-size: 1.75rem;
}
.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.avatar-initials {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
}
.user-avatar-widget.circle .avatar-image,
.user-avatar-widget.circle .avatar-initials {
    border-radius: 50%;
}
.user-avatar-widget.square .avatar-image,
.user-avatar-widget.square .avatar-initials {
    border-radius: var(--radius-md);
}
.user-avatar-name {
    font-size: 0.875rem;
    color: var(--text-primary);
}
.user-status {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
    position: absolute;
    bottom: 0;
    right: 0;
}
.user-status.online {
    background: var(--color-success);
}
.user-status.offline {
    background: var(--color-gray-400);
}
.user-avatar-group {
    display: flex;
    align-items: center;
}
.user-avatar-group .group-avatar {
    transition: margin 0.2s ease;
}
.user-avatar-group:hover .group-avatar {
    margin-left: 0 !important;
}
.avatar-count {
    width: 40px;
    height: 40px;
    background: var(--bg-secondary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    border: 2px solid white;
}
.user-avatar-menu {
    position: relative;
    display: inline-block;
}
.avatar-trigger {
    cursor: pointer;
}
.avatar-menu-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    min-width: 180px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    margin-top: 0.5rem;
}
.menu-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: right;
    transition: all var(--transition-fast);
}
.menu-item:hover {
    background: var(--bg-secondary);
}
.menu-item.danger {
    color: var(--color-danger);
}
.menu-item.danger:hover {
    background: var(--color-danger-soft);
}
.menu-divider {
    margin: 0.25rem 0;
    border: none;
    border-top: 1px solid var(--border-color);
}
</style>
`;

if (!document.querySelector('#user-avatar-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'user-avatar-styles';
    styleSheet.textContent = userAvatarStyles;
    document.head.appendChild(styleSheet);
}

window.UserAvatarWidget = UserAvatarWidget;
