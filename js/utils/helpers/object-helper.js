 /* ============================================
   OBJECT-HELPER.JS - توابع کمکی شیء
   ============================================ */

const ObjectHelper = {
    // ===== بررسی خالی بودن =====
    isEmpty: function(obj) {
        return !obj || Object.keys(obj).length === 0;
    },
    
    // ===== دریافت کلیدها =====
    keys: function(obj) {
        return Object.keys(obj);
    },
    
    // ===== دریافت مقادیر =====
    values: function(obj) {
        return Object.values(obj);
    },
    
    // ===== دریافت ورودی‌ها =====
    entries: function(obj) {
        return Object.entries(obj);
    },
    
    // ===== ادغام عمیق =====
    deepMerge: function(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    },
    
    // ===== کپی عمیق =====
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            cloned[key] = this.deepClone(obj[key]);
        }
        return cloned;
    },
    
    // ===== حذف فیلدهای خالی =====
    compact: function(obj) {
        const result = {};
        for (const key in obj) {
            if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
                result[key] = obj[key];
            }
        }
        return result;
    },
    
    // ===== انتخاب فیلدهای مشخص =====
    pick: function(obj, keys) {
        const result = {};
        for (const key of keys) {
            if (obj.hasOwnProperty(key)) {
                result[key] = obj[key];
            }
        }
        return result;
    },
    
    // ===== حذف فیلدهای مشخص =====
    omit: function(obj, keys) {
        const result = { ...obj };
        for (const key of keys) {
            delete result[key];
        }
        return result;
    },
    
    // ===== تغییر نام کلید =====
    renameKey: function(obj, oldKey, newKey) {
        if (!obj.hasOwnProperty(oldKey)) return obj;
        const result = { ...obj };
        result[newKey] = result[oldKey];
        delete result[oldKey];
        return result;
    },
    
    // ===== نقشه برداری بر روی مقادیر =====
    mapValues: function(obj, fn) {
        const result = {};
        for (const key in obj) {
            result[key] = fn(obj[key], key);
        }
        return result;
    },
    
    // ===== فیلتر کردن =====
    filter: function(obj, predicate) {
        const result = {};
        for (const key in obj) {
            if (predicate(obj[key], key)) {
                result[key] = obj[key];
            }
        }
        return result;
    },
    
    // ===== تبدیل به آرایه =====
    toArray: function(obj) {
        return Object.values(obj);
    },
    
    // ===== دریافت مقدار با مسیر نقطه‌دار =====
    get: function(obj, path, defaultValue = undefined) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined || !current.hasOwnProperty(key)) {
                return defaultValue;
            }
            current = current[key];
        }
        
        return current;
    },
    
    // ===== تنظیم مقدار با مسیر نقطه‌دار =====
    set: function(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return obj;
    },
    
    // ===== بررسی وجود مسیر =====
    has: function(obj, path) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined || !current.hasOwnProperty(key)) {
                return false;
            }
            current = current[key];
        }
        
        return true;
    },
    
    // ===== مقایسه دو شیء =====
    isEqual: function(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    },
    
    // ===== تبدیل به فرم داده =====
    toFormData: function(obj) {
        const formData = new FormData();
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (Array.isArray(obj[key])) {
                    obj[key].forEach(item => {
                        formData.append(`${key}[]`, item);
                    });
                } else {
                    formData.append(key, obj[key]);
                }
            }
        }
        return formData;
    },
    
    // ===== تبدیل به query string =====
    toQueryString: function(obj) {
        const params = new URLSearchParams();
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== undefined && obj[key] !== null) {
                params.append(key, obj[key]);
            }
        }
        return params.toString();
    },
    
    // ===== معکوس کردن کلید و مقدار =====
    invert: function(obj) {
        const result = {};
        for (const key in obj) {
            result[obj[key]] = key;
        }
        return result;
    },
    
    // ===== تعداد کلیدها =====
    size: function(obj) {
        return Object.keys(obj).length;
    },
    
    // ===== بررسی وجود کلید =====
    hasKey: function(obj, key) {
        return obj.hasOwnProperty(key);
    },
    
    // ===== ادغام ساده =====
    merge: function(...objects) {
        return Object.assign({}, ...objects);
    },
    
    // ===== فریز کردن عمیق =====
    deepFreeze: function(obj) {
        Object.freeze(obj);
        for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object') {
                this.deepFreeze(obj[key]);
            }
        }
        return obj;
    }
};

window.ObjectHelper = ObjectHelper;
