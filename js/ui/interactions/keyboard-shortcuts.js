 /* ============================================
   KEYBOARD-SHORTCUTS.JS - میانبرهای صفحه کلید
   ============================================ */

const KeyboardShortcuts = {
    // میانبرهای ثبت شده
    shortcuts: {},
    
    // پیشوند کلیدها
    prefixes: {
        ctrl: 'Ctrl',
        alt: 'Alt',
        shift: 'Shift',
        meta: 'Meta'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachGlobalEvents();
        this.registerDefaultShortcuts();
        console.log('⌨️ Keyboard Shortcuts راه‌اندازی شد');
    },
    
    // ===== ثبت میانبر جدید =====
    register: function(key, callback, description = '') {
        const normalizedKey = this.normalizeKey(key);
        this.shortcuts[normalizedKey] = {
            callback: callback,
            description: description,
            key: normalizedKey
        };
        
        return this;
    },
    
    // ===== حذف میانبر =====
    unregister: function(key) {
        const normalizedKey = this.normalizeKey(key);
        delete this.shortcuts[normalizedKey];
        return this;
    },
    
    // ===== نرمال‌سازی کلید =====
    normalizeKey: function(key) {
        return key.toLowerCase().replace(/\s/g, '');
    },
    
    // ===== دریافت کلید فشرده شده =====
    getPressedKey: function(event) {
        const parts = [];
        if (event.ctrlKey) parts.push(this.prefixes.ctrl);
        if (event.altKey) parts.push(this.prefixes.alt);
        if (event.shiftKey) parts.push(this.prefixes.shift);
        if (event.metaKey) parts.push(this.prefixes.meta);
        
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        parts.push(key);
        
        return parts.join('+').toLowerCase();
    },
    
    // ===== اتصال رویدادهای سراسری =====
    attachGlobalEvents: function() {
        document.addEventListener('keydown', (e) => {
            // جلوگیری از اجرا در input/textarea
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }
            
            const pressedKey = this.getPressedKey(e);
            const shortcut = this.shortcuts[pressedKey];
            
            if (shortcut) {
                e.preventDefault();
                shortcut.callback(e);
            }
        });
    },
    
    // ===== ثبت میانبرهای پیش‌فرض =====
    registerDefaultShortcuts: function() {
        this.register('ctrl+h', () => {
            window.location.href = '/';
        }, 'رفتن به صفحه اصلی');
        
        this.register('ctrl+b', () => {
            window.location.href = '/booking';
        }, 'رفتن به صفحه رزرو');
        
        this.register('ctrl+p', () => {
            window.location.href = '/profile';
        }, 'رفتن به پروفایل');
        
        this.register('ctrl+/', () => {
            this.showHelpModal();
        }, 'نمایش راهنما');
        
        this.register('escape', () => {
            this.closeAllModals();
        }, 'بستن مودال‌ها');
        
        this.register('ctrl+k', () => {
            this.focusSearch();
        }, 'فوکوس روی جستجو');
    },
    
    // ===== نمایش مودال راهنما =====
    showHelpModal: function() {
        const shortcutsList = Object.values(this.shortcuts);
        
        const modal = ModalFactory.createModal({
            title: '⌨️ میانبرهای صفحه کلید',
            content: `
                <div class="shortcuts-grid">
                    ${shortcutsList.map(s => `
                        <div class="shortcut-item">
                            <kbd>${s.key}</kbd>
                            <span>${s.description}</span>
                        </div>
                    `).join('')}
                </div>
            `,
            size: 'md'
        });
    },
    
    // ===== بستن همه مودال‌ها =====
    closeAllModals: function() {
        const modals = document.querySelectorAll('.modal-backdrop');
        modals.forEach(modal => modal.remove());
    },
    
    // ===== فوکوس روی جستجو =====
    focusSearch: function() {
        const searchInput = document.querySelector('input[type="search"], .search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
};

// استایل‌های راهنما
const shortcutsStyles = `
<style>
.shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
    padding: 0.5rem;
}
.shortcut-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border-color);
}
.shortcut-item kbd {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-family: monospace;
    font-size: 0.75rem;
    box-shadow: 0 1px 0 rgba(0,0,0,0.1);
}
</style>
`;

if (!document.querySelector('#shortcuts-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'shortcuts-styles';
    styleSheet.textContent = shortcutsStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    KeyboardShortcuts.init();
});

window.KeyboardShortcuts = KeyboardShortcuts;
