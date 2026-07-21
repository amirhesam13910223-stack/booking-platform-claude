 /* ============================================
   RETRY-LOGIC.JS - منطق تلاش مجدد
   ============================================ */

const RetryLogic = {
    // ===== تلاش مجدد با استراتژی خطی =====
    linearRetry: async function(fn, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await this.sleep(delay);
                }
            }
        }
        
        throw lastError;
    },
    
    // ===== تلاش مجدد با استراتژی نمایی =====
    exponentialRetry: async function(fn, maxRetries = 5, baseDelay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    const delay = baseDelay * Math.pow(2, i);
                    await this.sleep(delay);
                }
            }
        }
        
        throw lastError;
    },
    
    // ===== تلاش مجدد با jitter =====
    jitterRetry: async function(fn, maxRetries = 5, baseDelay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    const jitter = Math.random() * 500;
                    const delay = baseDelay * Math.pow(2, i) + jitter;
                    await this.sleep(delay);
                }
            }
        }
        
        throw lastError;
    },
    
    // ===== تلاش مجدد با شرط =====
    conditionalRetry: async function(fn, shouldRetry, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await fn();
                if (shouldRetry(result)) {
                    await this.sleep(delay);
                    continue;
                }
                return result;
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await this.sleep(delay);
                }
            }
        }
        
        throw lastError;
    },
    
    // ===== تاخیر =====
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // ===== بررسی خطاهای قابل تلاش مجدد =====
    isRetryableError: function(error) {
        // خطاهای شبکه
        if (error.message === 'Failed to fetch') return true;
        if (error.message === 'Network request failed') return true;
        
        // وضعیت‌های HTTP قابل تلاش مجدد
        const retryableStatuses = [408, 429, 500, 502, 503, 504];
        if (error.status && retryableStatuses.includes(error.status)) return true;
        
        // خطاهای WebSocket
        if (error.code === 1006) return true; // اتصال غیرعادی بسته شد
        
        return false;
    },
    
    // ===== تلاش مجدد هوشمند =====
    smartRetry: async function(fn, options = {}) {
        const {
            maxRetries = 5,
            baseDelay = 1000,
            maxDelay = 30000,
            backoffMultiplier = 2,
            jitter = true
        } = options;
        
        let lastError;
        let delay = baseDelay;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (!this.isRetryableError(error) || i === maxRetries - 1) {
                    throw lastError;
                }
                
                // محاسبه تاخیر بعدی
                let nextDelay = Math.min(delay * backoffMultiplier, maxDelay);
                if (jitter) {
                    nextDelay = nextDelay * (0.5 + Math.random());
                }
                
                console.log(`🔄 تلاش مجدد ${i + 1}/${maxRetries} در ${Math.round(nextDelay)}ms`);
                await this.sleep(nextDelay);
                delay = nextDelay;
            }
        }
        
        throw lastError;
    },
    
    // ===== تابع با قابلیت لغو =====
    cancellableRetry: function(fn, maxRetries = 3) {
        let cancelled = false;
        let currentTimeout = null;
        
        const cancel = () => {
            cancelled = true;
            if (currentTimeout) {
                clearTimeout(currentTimeout);
            }
        };
        
        const execute = async () => {
            for (let i = 0; i < maxRetries && !cancelled; i++) {
                try {
                    return await fn();
                } catch (error) {
                    if (i === maxRetries - 1 || cancelled) throw error;
                    await new Promise(resolve => {
                        currentTimeout = setTimeout(resolve, 1000 * Math.pow(2, i));
                    });
                }
            }
        };
        
        return { execute, cancel };
    },
    
    // ===== تلاش مجدد با timeout =====
    retryWithTimeout: async function(fn, timeout = 30000, maxRetries = 3) {
        const startTime = Date.now();
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            if (Date.now() - startTime > timeout) {
                throw new Error('Timeout exceeded');
            }
            
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await this.sleep(1000);
                }
            }
        }
        
        throw lastError;
    },
    
    // ===== تابع Retry wrapper =====
    wrap: function(fn, options = {}) {
        const self = this;
        return function(...args) {
            return self.smartRetry(() => fn(...args), options);
        };
    }
};

window.RetryLogic = RetryLogic;
