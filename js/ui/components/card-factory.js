/* ============================================
   CARD-FACTORY.JS - تولید کارت‌ها
   ============================================ */

   const CardFactory = {
    // انواع کارت
    variants: {
        default: 'card',
        elevated: 'card-elevated',
        outlined: 'card-outlined',
        interactive: 'card-interactive'
    },
    
    // ===== ایجاد کارت پایه =====
    create: function(options = {}) {
        const {
            title = null,
            subtitle = null,
            content = null,
            footer = null,
            image = null,
            imagePosition = 'top', // top, bottom, left, right
            variant = 'default',
            className = '',
            onClick = null
        } = options;
        
        const card = document.createElement('div');
        card.className = this.getCardClasses(variant, className);
        
        if (onClick) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', onClick);
        }
        
        // تصویر
        if (image && (imagePosition === 'top' || imagePosition === 'bottom')) {
            const imgContainer = this.createImage(image);
            card.appendChild(imgContainer);
        }
        
        // محتوای اصلی
        const body = this.createBody(title, subtitle, content);
        card.appendChild(body);
        
        // تصویر در کنار
        if (image && (imagePosition === 'left' || imagePosition === 'right')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'card-horizontal';
            const imgContainer = this.createImage(image);
            if (imagePosition === 'left') {
                wrapper.appendChild(imgContainer);
                wrapper.appendChild(body);
            } else {
                wrapper.appendChild(body);
                wrapper.appendChild(imgContainer);
            }
            card.innerHTML = '';
            card.appendChild(wrapper);
        }
        
        // فوتر
        if (footer) {
            const footerElement = this.createFooter(footer);
            card.appendChild(footerElement);
        }
        
        return card;
    },
    
    // ===== دریافت کلاس‌های کارت =====
    getCardClasses: function(variant, customClass) {
        const classes = [this.variants[variant] || this.variants.default];
        if (customClass) classes.push(customClass);
        return classes.join(' ');
    },
    
    // ===== ایجاد بخش تصویر =====
    createImage: function(image) {
        const container = document.createElement('div');
        container.className = 'card-image';
        
        if (typeof image === 'string') {
            const img = document.createElement('img');
            img.src = image;
            img.alt = 'Card image';
            container.appendChild(img);
        } else {
            container.appendChild(image);
        }
        
        return container;
    },
    
    // ===== ایجاد بدنه کارت =====
    createBody: function(title, subtitle, content) {
        const body = document.createElement('div');
        body.className = 'card-body';
        
        if (title) {
            const titleEl = document.createElement('h3');
            titleEl.className = 'card-title';
            titleEl.textContent = title;
            body.appendChild(titleEl);
        }
        
        if (subtitle) {
            const subtitleEl = document.createElement('p');
            subtitleEl.className = 'card-subtitle';
            subtitleEl.textContent = subtitle;
            body.appendChild(subtitleEl);
        }
        
        if (content) {
            const contentEl = document.createElement('div');
            contentEl.className = 'card-content';
            if (typeof content === 'string') {
                contentEl.textContent = content;
            } else {
                contentEl.appendChild(content);
            }
            body.appendChild(contentEl);
        }
        
        return body;
    },
    
    // ===== ایجاد فوتر کارت =====
    createFooter: function(footer) {
        const footerEl = document.createElement('div');
        footerEl.className = 'card-footer';
        
        if (typeof footer === 'string') {
            footerEl.textContent = footer;
        } else {
            footerEl.appendChild(footer);
        }
        
        return footerEl;
    },
    
    // ===== ایجاد کارت سرویس =====
    createServiceCard: function(service, onClick) {
        return this.create({
            title: service.name,
            subtitle: `${service.duration} دقیقه`,
            content: `
                <div class="service-price">${PriceHelper.formatPrice(service.price)}</div>
                ${service.description ? `<p class="service-desc">${service.description}</p>` : ''}
            `,
            footer: ButtonFactory.create({
                text: 'انتخاب',
                variant: 'outline',
                onClick: () => onClick && onClick(service)
            }),
            variant: 'interactive'
        });
    },
    
    // ===== ایجاد کارت نوبت =====
    createBookingCard: function(booking, onCancel, onReschedule) {
        const date = new Date(booking.date).toLocaleDateString('fa-IR');
        
        return this.create({
            title: booking.business.name,
            subtitle: `${date} - ${booking.time}`,
            content: `
                <div class="booking-service">${booking.service.name}</div>
                <div class="booking-price">${PriceHelper.formatPrice(booking.finalPrice)}</div>
                <div class="booking-status ${booking.status}">${this.getStatusText(booking.status)}</div>
            `,
            footer: this.createBookingActions(booking, onCancel, onReschedule)
        });
    },
    
    // ===== ایجاد دکمه‌های اقدام نوبت =====
    createBookingActions: function(booking, onCancel, onReschedule) {
        const container = document.createElement('div');
        container.className = 'booking-actions';
        
        if (booking.status === 'confirmed') {
            if (onReschedule) {
                const rescheduleBtn = ButtonFactory.create({
                    text: 'تغییر زمان',
                    variant: 'outline',
                    size: 'sm',
                    onClick: () => onReschedule(booking)
                });
                container.appendChild(rescheduleBtn);
            }
            
            if (onCancel) {
                const cancelBtn = ButtonFactory.create({
                    text: 'لغو نوبت',
                    variant: 'danger',
                    size: 'sm',
                    onClick: () => onCancel(booking)
                });
                container.appendChild(cancelBtn);
            }
        }
        
        return container;
    },
    
    // ===== دریافت متن وضعیت =====
    getStatusText: function(status) {
        const statusMap = {
            pending: 'در انتظار تأیید',
            confirmed: 'تأیید شده',
            completed: 'انجام شده',
            cancelled: 'لغو شده'
        };
        return statusMap[status] || status;
    }
};

// استایل‌های کارت
const cardStyles = `
<style>
.card {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    overflow: hidden;
}
.card-elevated {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.card-elevated:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}
.card-outlined {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
}
.card-interactive {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all var(--transition-fast);
}
.card-interactive:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}
.card-image img {
    width: 100%;
    height: auto;
    object-fit: cover;
}
.card-horizontal {
    display: flex;
}
.card-horizontal .card-image {
    width: 40%;
}
.card-horizontal .card-body {
    flex: 1;
}
.card-body {
    padding: 1rem;
}
.card-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}
.card-subtitle {
    font-size: 0.875rem;
    color: var(--text-tertiary);
    margin-bottom: 0.75rem;
}
.card-content {
    font-size: 0.875rem;
    color: var(--text-secondary);
}
.card-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--border-color);
    background: var(--bg-secondary);
}
.service-price {
    font-size: 1.125rem;
    font-weight: bold;
    color: var(--color-primary);
    margin: 0.5rem 0;
}
.booking-status {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    margin-top: 0.5rem;
}
.booking-status.confirmed {
    background: var(--color-success-soft);
    color: var(--color-success);
}
.booking-status.pending {
    background: var(--color-warning-soft);
    color: var(--color-warning);
}
.booking-status.cancelled {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}
.booking-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}
</style>
`;

if (!document.querySelector('#card-factory-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'card-factory-styles';
    styleSheet.textContent = cardStyles;
    document.head.appendChild(styleSheet);
}

window.CardFactory = CardFactory; 
