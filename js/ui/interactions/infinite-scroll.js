 /* ============================================
   INFINITE-SCROLL.JS - اسکرول نامحدود
   ============================================ */

const InfiniteScroll = {
    // تنظیمات
    config: {
        threshold: 200, // فاصله از انتها برای بارگذاری بعدی (px)
        loadingText: 'در حال بارگذاری...',
        noMoreText: 'پایان لیست',
        errorText: 'خطا در بارگذاری'
    },
    
    // نمونه‌های فعال
    instances: [],
    
    // ===== ایجاد نمونه جدید =====
    create: function(container, options = {}) {
        const {
            onLoadMore = null,
            hasMore = true,
            loading = false,
            threshold = this.config.threshold,
            loaderElement = null,
            noMoreElement = null
        } = options;
        
        const instance = {
            container: container,
            onLoadMore: onLoadMore,
            hasMore: hasMore,
            loading: loading,
            threshold: threshold,
            loaderElement: loaderElement,
            noMoreElement: noMoreElement,
            observer: null
        };
        
        // ایجاد عناصر نشانگر
        if (!loaderElement) {
            instance.loaderElement = this.createLoaderElement();
            container.parentNode?.insertBefore(instance.loaderElement, container.nextSibling);
        }
        
        if (!noMoreElement) {
            instance.noMoreElement = this.createNoMoreElement();
            container.parentNode?.insertBefore(instance.noMoreElement, container.nextSibling);
        }
        
        // تنظیم observer
        this.setupObserver(instance);
        
        this.instances.push(instance);
        
        return instance;
    },
    
    // ===== تنظیم Observer =====
    setupObserver: function(instance) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !instance.loading && instance.hasMore && instance.onLoadMore) {
                    this.loadMore(instance);
                }
            });
        }, {
            root: null,
            rootMargin: `0px 0px ${instance.threshold}px 0px`,
            threshold: 0
        });
        
        if (instance.loaderElement) {
            observer.observe(instance.loaderElement);
        }
        
        instance.observer = observer;
    },
    
    // ===== بارگذاری بیشتر =====
    loadMore: async function(instance) {
        if (instance.loading || !instance.hasMore) return;
        
        instance.loading = true;
        this.showLoader(instance);
        
        try {
            const result = await instance.onLoadMore();
            instance.hasMore = result.hasMore !== false;
            
            if (!instance.hasMore) {
                this.showNoMore(instance);
            }
        } catch (error) {
            console.error('خطا در بارگذاری:', error);
            this.showError(instance);
        } finally {
            instance.loading = false;
            this.hideLoader(instance);
        }
    },
    
    // ===== ایجاد عنصر لودینگ =====
    createLoaderElement: function() {
        const loader = document.createElement('div');
        loader.className = 'infinite-scroll-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <span>${this.config.loadingText}</span>
        `;
        loader.style.display = 'none';
        return loader;
    },
    
    // ===== ایجاد عنصر پایان =====
    createNoMoreElement: function() {
        const noMore = document.createElement('div');
        noMore.className = 'infinite-scroll-nomore';
        noMore.innerHTML = `<span>✨ ${this.config.noMoreText} ✨</span>`;
        noMore.style.display = 'none';
        return noMore;
    },
    
    // ===== نمایش لودینگ =====
    showLoader: function(instance) {
        if (instance.loaderElement) {
            instance.loaderElement.style.display = 'flex';
        }
    },
    
    // ===== مخفی کردن لودینگ =====
    hideLoader: function(instance) {
        if (instance.loaderElement) {
            instance.loaderElement.style.display = 'none';
        }
    },
    
    // ===== نمایش پایان =====
    showNoMore: function(instance) {
        if (instance.noMoreElement) {
            instance.noMoreElement.style.display = 'flex';
        }
        if (instance.loaderElement) {
            instance.loaderElement.style.display = 'none';
        }
    },
    
    // ===== نمایش خطا =====
    showError: function(instance) {
        if (instance.loaderElement) {
            instance.loaderElement.innerHTML = `
                <span style="color: var(--color-danger)">❌ ${this.config.errorText}</span>
                <button class="btn btn-sm" onclick="location.reload()">تلاش مجدد</button>
            `;
            instance.loaderElement.style.display = 'flex';
        }
    },
    
    // ===== ریست نمونه =====
    reset: function(instance) {
        instance.hasMore = true;
        instance.loading = false;
        if (instance.noMoreElement) {
            instance.noMoreElement.style.display = 'none';
        }
        if (instance.loaderElement) {
            instance.loaderElement.style.display = 'none';
            instance.loaderElement.innerHTML = `
                <div class="loader-spinner"></div>
                <span>${this.config.loadingText}</span>
            `;
        }
    },
    
    // ===== حذف نمونه =====
    destroy: function(instance) {
        if (instance.observer) {
            instance.observer.disconnect();
        }
        
        if (instance.loaderElement) {
            instance.loaderElement.remove();
        }
        
        if (instance.noMoreElement) {
            instance.noMoreElement.remove();
        }
        
        const index = this.instances.indexOf(instance);
        if (index !== -1) this.instances.splice(index, 1);
    },
    
    // ===== تنظیم روی لیست =====
    setupOnList: function(listElement, loadMoreFn, options = {}) {
        return this.create(listElement, {
            onLoadMore: loadMoreFn,
            ...options
        });
    }
};

// استایل‌های اسکرول نامحدود
const infiniteScrollStyles = `
<style>
.infinite-scroll-loader,
.infinite-scroll-nomore {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    text-align: center;
    color: var(--text-tertiary);
}
.infinite-scroll-loader .loader-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: infinite-spin 0.6s linear infinite;
}
@keyframes infinite-spin {
    to { transform: rotate(360deg); }
}
</style>
`;

if (!document.querySelector('#infinite-scroll-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'infinite-scroll-styles';
    styleSheet.textContent = infiniteScrollStyles;
    document.head.appendChild(styleSheet);
}

window.InfiniteScroll = InfiniteScroll;
