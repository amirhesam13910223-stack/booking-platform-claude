 /* ============================================
   LAZY-LOAD.JS - بارگذاری تنبل تصاویر
   ============================================ */

const LazyLoad = {
    // تنظیمات
    config: {
        rootMargin: '50px',
        threshold: 0.01,
        placeholderClass: 'lazy-placeholder',
        loadedClass: 'lazy-loaded'
    },
    
    // observer
    observer: null,
    
    // ===== مقداردهی اولیه =====
    init: function(options = {}) {
        this.config = { ...this.config, ...options };
        
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: this.config.rootMargin,
                threshold: this.config.threshold
            });
            
            this.observeImages();
        } else {
            this.loadAllImages();
        }
        
        console.log('🖼️ Lazy Load راه‌اندازی شد');
    },
    
    // ===== مشاهده تصاویر =====
    observeImages: function() {
        const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        images.forEach(img => this.observer.observe(img));
    },
    
    // ===== بارگذاری تصویر =====
    loadImage: function(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
        }
        
        if (srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
        }
        
        img.classList.add(this.config.loadedClass);
        img.classList.remove(this.config.placeholderClass);
        
        // رویداد بارگذاری کامل
        img.addEventListener('load', () => {
            img.dispatchEvent(new CustomEvent('lazy:loaded'));
        });
        
        // رویداد خطا
        img.addEventListener('error', () => {
            console.warn(`خطا در بارگذاری تصویر: ${src}`);
            img.dispatchEvent(new CustomEvent('lazy:error'));
        });
    },
    
    // ===== بارگذاری همه تصاویر (fallback) =====
    loadAllImages: function() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => this.loadImage(img));
    },
    
    // ===== افزودن تصویر جدید به observer =====
    addImage: function(img) {
        if (this.observer) {
            this.observer.observe(img);
        } else {
            this.loadImage(img);
        }
    },
    
    // ===== حذف تصویر از observer =====
    removeImage: function(img) {
        if (this.observer) {
            this.observer.unobserve(img);
        }
    },
    
    // ===== تنظیم پیش‌فرض برای تصاویر =====
    setupDefaultImages: function() {
        // تنظیم placeholder
        const images = document.querySelectorAll('img:not([src])');
        images.forEach(img => {
            if (!img.hasAttribute('data-src')) return;
            img.classList.add(this.config.placeholderClass);
            
            // نمایش placeholder
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23F3F4F6"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239CA3AF"%3E🖼️%3C/text%3E%3C/svg%3E';
        });
    },
    
    // ===== بارگذاری پس‌زمینه =====
    loadBackground: function(element) {
        const bgSrc = element.dataset.bgSrc;
        if (bgSrc) {
            const img = new Image();
            img.onload = () => {
                element.style.backgroundImage = `url(${bgSrc})`;
                element.classList.add(this.config.loadedClass);
                element.removeAttribute('data-bg-src');
            };
            img.src = bgSrc;
        }
    },
    
    // ===== بارگذاری iframe =====
    loadIframe: function(iframe) {
        const src = iframe.dataset.src;
        if (src) {
            iframe.src = src;
            iframe.removeAttribute('data-src');
            iframe.classList.add(this.config.loadedClass);
        }
    }
};

// استایل‌های بارگذاری تنبل
const lazyLoadStyles = `
<style>
img.lazy-placeholder {
    background: var(--bg-secondary);
    min-height: 100px;
    object-fit: cover;
}
img.lazy-loaded {
    animation: lazy-fade-in 0.3s ease;
}
@keyframes lazy-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>
`;

if (!document.querySelector('#lazyload-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'lazyload-styles';
    styleSheet.textContent = lazyLoadStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    LazyLoad.init();
});

window.LazyLoad = LazyLoad;
