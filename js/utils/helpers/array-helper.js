/* ============================================
   ARRAY-HELPER.JS - توابع کمکی آرایه
   ============================================ */

   const ArrayHelper = {
    // ===== بررسی خالی بودن =====
    isEmpty: function(arr) {
        return !arr || arr.length === 0;
    },
    
    // ===== آخرین عنصر =====
    last: function(arr) {
        if (this.isEmpty(arr)) return null;
        return arr[arr.length - 1];
    },
    
    // ===== اولین عنصر =====
    first: function(arr) {
        if (this.isEmpty(arr)) return null;
        return arr[0];
    },
    
    // ===== حذف المان تکراری =====
    unique: function(arr) {
        return [...new Set(arr)];
    },
    
    // ===== حذف مقادیر null و undefined =====
    compact: function(arr) {
        return arr.filter(item => item !== null && item !== undefined);
    },
    
    // ===== گروه‌بندی بر اساس کلید =====
    groupBy: function(arr, key) {
        return arr.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) result[groupKey] = [];
            result[groupKey].push(item);
            return result;
        }, {});
    },
    
    // ===== گروه‌بندی بر اساس تابع =====
    groupByFn: function(arr, fn) {
        return arr.reduce((result, item) => {
            const groupKey = fn(item);
            if (!result[groupKey]) result[groupKey] = [];
            result[groupKey].push(item);
            return result;
        }, {});
    },
    
    // ===== مرتب‌سازی بر اساس کلید =====
    sortBy: function(arr, key, order = 'asc') {
        const sorted = [...arr];
        sorted.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (order === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });
        return sorted;
    },
    
    // ===== مرتب‌سازی بر اساس تابع =====
    sortByFn: function(arr, fn, order = 'asc') {
        const sorted = [...arr];
        sorted.sort((a, b) => {
            const aVal = fn(a);
            const bVal = fn(b);
            if (order === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });
        return sorted;
    },
    
    // ===== فیلتر بر اساس جستجو =====
    search: function(arr, searchTerm, keys) {
        if (!searchTerm) return arr;
        const term = searchTerm.toLowerCase();
        return arr.filter(item => {
            return keys.some(key => {
                const value = item[key];
                return value && String(value).toLowerCase().includes(term);
            });
        });
    },
    
    // ===== تبدیل به شیء =====
    toObject: function(arr, keyField) {
        return arr.reduce((result, item) => {
            result[item[keyField]] = item;
            return result;
        }, {});
    },
    
    // ===== ادغام آرایه‌ها =====
    merge: function(...arrays) {
        return [].concat(...arrays);
    },
    
    // ===== تفاوت دو آرایه =====
    difference: function(arr1, arr2) {
        return arr1.filter(item => !arr2.includes(item));
    },
    
    // ===== اشتراک دو آرایه =====
    intersection: function(arr1, arr2) {
        return arr1.filter(item => arr2.includes(item));
    },
    
    // ===== اجتماع دو آرایه =====
    union: function(arr1, arr2) {
        return this.unique([...arr1, ...arr2]);
    },
    
    // ===== حذف عنصر =====
    remove: function(arr, item) {
        const index = arr.indexOf(item);
        if (index !== -1) arr.splice(index, 1);
        return arr;
    },
    
    // ===== حذف عنصر بر اساس شرط =====
    removeWhere: function(arr, predicate) {
        const toRemove = [];
        for (let i = 0; i < arr.length; i++) {
            if (predicate(arr[i])) toRemove.push(i);
        }
        for (let i = toRemove.length - 1; i >= 0; i--) {
            arr.splice(toRemove[i], 1);
        }
        return arr;
    },
    
    // ===== جایگزینی عنصر =====
    replace: function(arr, oldItem, newItem) {
        const index = arr.indexOf(oldItem);
        if (index !== -1) arr[index] = newItem;
        return arr;
    },
    
    // ===== تکه تکه کردن =====
    chunk: function(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    },
    
    // ===== چرخاندن =====
    rotate: function(arr, steps) {
        const normalized = steps % arr.length;
        if (normalized === 0) return [...arr];
        return [...arr.slice(-normalized), ...arr.slice(0, -normalized)];
    },
    
    // ===== شفل کردن =====
    shuffle: function(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    // ===== جمع مقادیر =====
    sumBy: function(arr, key) {
        return arr.reduce((sum, item) => sum + (item[key] || 0), 0);
    },
    
    // ===== میانگین مقادیر =====
    averageBy: function(arr, key) {
        if (arr.length === 0) return 0;
        return this.sumBy(arr, key) / arr.length;
    },
    
    // ===== ماکزیمم =====
    maxBy: function(arr, key) {
        if (arr.length === 0) return null;
        return arr.reduce((max, item) => (item[key] > max[key] ? item : max), arr[0]);
    },
    
    // ===== مینیمم =====
    minBy: function(arr, key) {
        if (arr.length === 0) return null;
        return arr.reduce((min, item) => (item[key] < min[key] ? item : min), arr[0]);
    },
    
    // ===== آپدیت عناصر =====
    update: function(arr, predicate, updates) {
        return arr.map(item => {
            if (predicate(item)) {
                return { ...item, ...updates };
            }
            return item;
        });
    },
    
    // ===== صفحه‌بندی =====
    paginate: function(arr, page, perPage) {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        return {
            data: arr.slice(start, end),
            total: arr.length,
            page: page,
            perPage: perPage,
            totalPages: Math.ceil(arr.length / perPage)
        };
    }
};

window.ArrayHelper = ArrayHelper;
