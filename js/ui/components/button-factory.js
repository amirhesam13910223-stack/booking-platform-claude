 /* ============================================
   BUTTON-FACTORY.JS - تولید دکمه‌ها
   ============================================ */

const ButtonFactory = {
    // انواع دکمه
    variants: {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        outline: 'btn-outline',
        danger: 'btn-danger',
        success: 'btn-success',
        warning: 'btn-warning',
        info: 'btn-info',
        light: 'btn-light',
        dark: 'btn-dark',
        link: 'btn-link'
    },
    
    // اندازه‌ها
    sizes: {
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg',
        xl: 'btn-xl'
    },
    
    // ===== ایجاد دکمه =====
    create: function(options = {}) {
        const {
            text = 'دکمه',
            variant = 'primary',
            size = 'md',
            icon = null,
            iconPosition = 'right',
            disabled = false,
            loading = false,
            block = false,
            onClick = null,
            type = 'button',
            className = ''
        } = options;
        
        const button = document.createElement('button');
        button.type = type;
        button.className = this.getButtonClasses(variant, size, block, className);
        
        if (disabled) button.disabled = true;
        
        // محتوای دکمه
        const content = this.createContent(text, icon, iconPosition, loading);
        button.appendChild(content);
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    },
    
    // ===== دریافت کلاس‌های دکمه =====
    getButtonClasses: function(variant, size, block, customClass) {
        const classes = ['btn', this.variants[variant] || this.variants.primary];
        
        if (this.sizes[size]) classes.push(this.sizes[size]);
        if (block) classes.push('btn-block');
        if (customClass) classes.push(customClass);
        
        return classes.join(' ');
    },
    
    // ===== ایجاد محتوای دکمه =====
    createContent: function(text, icon, iconPosition, loading) {
        const container = document.createElement('span');
        container.className = 'btn-content';
        
        if (loading) {
            const spinner = document.createElement('span');
            spinner.className = 'spinner-border spinner-border-sm';
            spinner.setAttribute('role', 'status');
            container.appendChild(spinner);
        }
        
        if (icon && !loading) {
            const iconElement = document.createElement('span');
            iconElement.className = `btn-icon btn-icon-${iconPosition}`;
            iconElement.innerHTML = icon;
            container.appendChild(iconElement);
        }
        
        const textSpan = document.createElement('span');
        textSpan.className = 'btn-text';
        textSpan.textContent = text;
        container.appendChild(textSpan);
        
        return container;
    },
    
    // ===== ایجاد دکمه با آیکون =====
    createWithIcon: function(text, icon, variant = 'primary', onClick = null) {
        return this.create({
            text: text,
            icon: icon,
            variant: variant,
            onClick: onClick
        });
    },
    
    // ===== ایجاد دکمه لودینگ =====
    createLoading: function(text = 'در حال بارگذاری...', variant = 'primary') {
        return this.create({
            text: text,
            variant: variant,
            loading: true,
            disabled: true
        });
    },
    
    // ===== ایجاد دکمه گروه =====
    createGroup: function(buttons, options = {}) {
        const { vertical = false, className = '' } = options;
        const group = document.createElement('div');
        group.className = `btn-group ${vertical ? 'btn-group-vertical' : ''} ${className}`;
        
        buttons.forEach(btn => {
            const button = this.create(btn);
            group.appendChild(button);
        });
        
        return group;
    },
    
    // ===== به‌روزرسانی وضعیت لودینگ =====
    setLoading: function(button, loading) {
        if (loading) {
            button.disabled = true;
            const content = button.querySelector('.btn-content');
            if (content) {
                const originalContent = content.innerHTML;
                button.setAttribute('data-original-content', originalContent);
                const spinner = document.createElement('span');
                spinner.className = 'spinner-border spinner-border-sm';
                content.innerHTML = '';
                content.appendChild(spinner);
                const textSpan = document.createElement('span');
                textSpan.className = 'btn-text';
                textSpan.textContent = 'در حال بارگذاری...';
                content.appendChild(textSpan);
            }
        } else {
            button.disabled = false;
            const content = button.querySelector('.btn-content');
            const originalContent = button.getAttribute('data-original-content');
            if (content && originalContent) {
                content.innerHTML = originalContent;
                button.removeAttribute('data-original-content');
            }
        }
    },
    
    // ===== غیرفعال کردن دکمه =====
    disable: function(button, disabled = true) {
        button.disabled = disabled;
        if (disabled) {
            button.classList.add('disabled');
        } else {
            button.classList.remove('disabled');
        }
    },
    
    // ===== تغییر متن دکمه =====
    setText: function(button, text) {
        const textSpan = button.querySelector('.btn-text');
        if (textSpan) {
            textSpan.textContent = text;
        }
    },
    
    // ===== تغییر نوع دکمه =====
    setVariant: function(button, variant) {
        // حذف کلاس‌های قبلی
        Object.values(this.variants).forEach(v => button.classList.remove(v));
        button.classList.add(this.variants[variant] || this.variants.primary);
    }
};

// استایل‌های دکمه (در صورت نبودن در فایل اصلی)
const buttonStyles = `
<style>
.btn-group {
    display: inline-flex;
    gap: 0;
}
.btn-group-vertical {
    flex-direction: column;
}
.btn-group .btn:not(:first-child) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}
.btn-group .btn:not(:last-child) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}
.btn-icon-right {
    margin-right: 8px;
}
.btn-icon-left {
    margin-left: 8px;
}
.spinner-border {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 0.2em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border 0.75s linear infinite;
}
.spinner-border-sm {
    width: 0.875rem;
    height: 0.875rem;
    border-width: 0.15em;
}
@keyframes spinner-border {
    to { transform: rotate(360deg); }
}
.btn-block {
    display: block;
    width: 100%;
}
.btn-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
.btn-md { padding: 0.5rem 1rem; font-size: 1rem; }
.btn-lg { padding: 0.75rem 1.5rem; font-size: 1.125rem; }
.btn-xl { padding: 1rem 2rem; font-size: 1.25rem; }
</style>
`;

if (!document.querySelector('#button-factory-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'button-factory-styles';
    styleSheet.textContent = buttonStyles;
    document.head.appendChild(styleSheet);
}

window.ButtonFactory = ButtonFactory;
