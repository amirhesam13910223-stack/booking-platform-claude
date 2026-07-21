 /* ============================================
   DROPDOWN-FACTORY.JS - ساخت منوهای کشویی
   ============================================ */

const DropdownFactory = {
    // ===== ایجاد منوی کشویی =====
    createDropdown: function(options = {}) {
        const {
            triggerText = 'انتخاب کنید',
            triggerIcon = null,
            items = [],
            placement = 'bottom-start', // bottom-start, bottom-end, top-start, top-end
            onSelect = null,
            disabled = false
        } = options;
        
        const container = document.createElement('div');
        container.className = 'dropdown';
        
        // دکمه ماشه
        const trigger = document.createElement('button');
        trigger.className = 'dropdown-trigger btn btn-outline';
        if (disabled) trigger.disabled = true;
        
        const triggerContent = document.createElement('span');
        triggerContent.className = 'dropdown-trigger-content';
        
        if (triggerIcon) {
            const icon = document.createElement('span');
            icon.className = 'dropdown-icon';
            icon.textContent = triggerIcon;
            triggerContent.appendChild(icon);
        }
        
        const text = document.createElement('span');
        text.textContent = triggerText;
        triggerContent.appendChild(text);
        
        const arrow = document.createElement('span');
        arrow.className = 'dropdown-arrow';
        arrow.textContent = '▼';
        triggerContent.appendChild(arrow);
        
        trigger.appendChild(triggerContent);
        container.appendChild(trigger);
        
        // منو
        const menu = document.createElement('div');
        menu.className = `dropdown-menu ${placement}`;
        
        items.forEach(item => {
            const menuItem = this.createMenuItem(item, onSelect);
            menu.appendChild(menuItem);
        });
        
        container.appendChild(menu);
        
        // رویدادها
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                menu.classList.remove('show');
            }
        });
        
        return container;
    },
    
    // ===== ایجاد آیتم منو =====
    createMenuItem: function(item, onSelect) {
        const {
            label,
            value,
            icon = null,
            divider = false,
            disabled = false,
            danger = false,
            onClick = null
        } = item;
        
        if (divider) {
            const dividerEl = document.createElement('hr');
            dividerEl.className = 'dropdown-divider';
            return dividerEl;
        }
        
        const menuItem = document.createElement('button');
        menuItem.className = `dropdown-item ${danger ? 'dropdown-item-danger' : ''}`;
        if (disabled) menuItem.disabled = true;
        
        const content = document.createElement('span');
        content.className = 'dropdown-item-content';
        
        if (icon) {
            const iconEl = document.createElement('span');
            iconEl.className = 'dropdown-item-icon';
            iconEl.textContent = icon;
            content.appendChild(iconEl);
        }
        
        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        content.appendChild(labelEl);
        
        menuItem.appendChild(content);
        
        menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!disabled) {
                if (onClick) onClick(value, label);
                if (onSelect) onSelect(value, label);
            }
        });
        
        return menuItem;
    },
    
    // ===== ایجاد منوی انتخاب =====
    createSelectDropdown: function(options = {}) {
        const {
            items = [],
            selectedValue = null,
            placeholder = 'انتخاب کنید...',
            onSelect = null
        } = options;
        
        const selectedItem = items.find(i => i.value === selectedValue);
        const triggerText = selectedItem ? selectedItem.label : placeholder;
        
        return this.createDropdown({
            triggerText: triggerText,
            items: items,
            onSelect: (value, label) => {
                if (onSelect) onSelect(value, label);
                const trigger = document.querySelector('.dropdown-trigger .dropdown-trigger-content span:not(.dropdown-arrow)');
                if (trigger) trigger.textContent = label;
            }
        });
    },
    
    // ===== ایجاد منوی اقدام =====
    createActionDropdown: function(options = {}) {
        const {
            triggerText = 'عملیات',
            actions = [],
            onAction = null
        } = options;
        
        const items = actions.map(action => ({
            label: action.label,
            value: action.value,
            icon: action.icon,
            danger: action.danger,
            onClick: () => onAction && onAction(action.value)
        }));
        
        return this.createDropdown({
            triggerText: triggerText,
            items: items
        });
    },
    
    // ===== ایجاد منوی پروفایل =====
    createProfileDropdown: function(user, onLogout) {
        const items = [
            { label: 'پروفایل من', value: 'profile', icon: '👤' },
            { label: 'نوبت‌های من', value: 'bookings', icon: '📅' },
            { label: 'کیف پول', value: 'wallet', icon: '💰' },
            { label: 'تنظیمات', value: 'settings', icon: '⚙️' },
            { divider: true },
            { label: 'خروج', value: 'logout', icon: '🚪', danger: true }
        ];
        
        return this.createDropdown({
            triggerText: user.name,
            triggerIcon: '👤',
            items: items,
            onSelect: (value) => {
                if (value === 'logout') {
                    onLogout();
                }
            }
        });
    }
};

// استایل‌های منوی کشویی
const dropdownStyles = `
<style>
.dropdown {
    position: relative;
    display: inline-block;
}
.dropdown-trigger {
    cursor: pointer;
}
.dropdown-trigger-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.dropdown-arrow {
    font-size: 0.7rem;
    margin-right: 0.25rem;
}
.dropdown-menu {
    position: absolute;
    z-index: 1000;
    min-width: 160px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all var(--transition-fast);
}
.dropdown-menu.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}
.dropdown-menu.bottom-start {
    top: 100%;
    left: 0;
    margin-top: 0.25rem;
}
.dropdown-menu.bottom-end {
    top: 100%;
    right: 0;
    margin-top: 0.25rem;
}
.dropdown-menu.top-start {
    bottom: 100%;
    left: 0;
    margin-bottom: 0.25rem;
}
.dropdown-menu.top-end {
    bottom: 100%;
    right: 0;
    margin-bottom: 0.25rem;
}
.dropdown-item {
    display: block;
    width: 100%;
    padding: 0.5rem 1rem;
    text-align: right;
    background: none;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
}
.dropdown-item:hover:not(:disabled) {
    background: var(--bg-secondary);
}
.dropdown-item-danger {
    color: var(--color-danger);
}
.dropdown-item-danger:hover {
    background: var(--color-danger-soft);
}
.dropdown-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
.dropdown-item-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.dropdown-divider {
    margin: 0.25rem 0;
    border: none;
    border-top: 1px solid var(--border-color);
}
</style>
`;

if (!document.querySelector('#dropdown-factory-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dropdown-factory-styles';
    styleSheet.textContent = dropdownStyles;
    document.head.appendChild(styleSheet);
}

window.DropdownFactory = DropdownFactory;
