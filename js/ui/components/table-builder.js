 /* ============================================
   TABLE-BUILDER.JS - ساخت جداول
   ============================================ */

const TableBuilder = {
    // ===== ایجاد جدول =====
    createTable: function(options = {}) {
        const {
            columns = [],
            data = [],
            className = '',
            striped = true,
            hover = true,
            bordered = false,
            responsive = true,
            onRowClick = null,
            actions = null
        } = options;
        
        const container = document.createElement('div');
        if (responsive) container.className = 'table-responsive';
        
        const table = document.createElement('table');
        table.className = this.getTableClasses(striped, hover, bordered, className);
        
        // هدر جدول
        const thead = this.createHeader(columns);
        table.appendChild(thead);
        
        // بدنه جدول
        const tbody = this.createBody(columns, data, actions, onRowClick);
        table.appendChild(tbody);
        
        container.appendChild(table);
        
        return container;
    },
    
    // ===== دریافت کلاس‌های جدول =====
    getTableClasses: function(striped, hover, bordered, customClass) {
        const classes = ['data-table'];
        if (striped) classes.push('table-striped');
        if (hover) classes.push('table-hover');
        if (bordered) classes.push('table-bordered');
        if (customClass) classes.push(customClass);
        return classes.join(' ');
    },
    
    // ===== ایجاد هدر =====
    createHeader: function(columns) {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            if (col.width) th.style.width = col.width;
            if (col.className) th.className = col.className;
            tr.appendChild(th);
        });
        
        if (columns.some(col => col.sortable)) {
            this.makeSortable(thead, columns);
        }
        
        thead.appendChild(tr);
        return thead;
    },
    
    // ===== ایجاد بدنه =====
    createBody: function(columns, data, actions, onRowClick) {
        const tbody = document.createElement('tbody');
        
        if (data.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = columns.length + (actions ? 1 : 0);
            td.className = 'empty-state';
            td.textContent = 'داده‌ای برای نمایش وجود ندارد';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return tbody;
        }
        
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            if (onRowClick) {
                tr.style.cursor = 'pointer';
                tr.addEventListener('click', () => onRowClick(row, index));
            }
            
            columns.forEach(col => {
                const td = document.createElement('td');
                let value = this.getNestedValue(row, col.key);
                
                if (col.formatter) {
                    value = col.formatter(value, row);
                }
                
                td.innerHTML = value;
                tr.appendChild(td);
            });
            
            if (actions) {
                const td = document.createElement('td');
                td.className = 'actions-cell';
                const actionButtons = this.createActionButtons(actions, row, index);
                actionButtons.forEach(btn => td.appendChild(btn));
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        });
        
        return tbody;
    },
    
    // ===== دریافت مقدار تو در تو =====
    getNestedValue: function(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : '';
        }, obj);
    },
    
    // ===== ایجاد دکمه‌های اقدام =====
    createActionButtons: function(actions, row, index) {
        const buttons = [];
        
        actions.forEach(action => {
            const button = ButtonFactory.create({
                text: action.label,
                variant: action.variant || 'outline',
                size: 'sm',
                onClick: () => action.onClick(row, index)
            });
            buttons.push(button);
        });
        
        return buttons;
    },
    
    // ===== فعال‌سازی مرتب‌سازی =====
    makeSortable: function(thead, columns) {
        const headers = thead.querySelectorAll('th');
        headers.forEach((th, index) => {
            if (columns[index].sortable) {
                th.style.cursor = 'pointer';
                th.classList.add('sortable');
                
                const sortIcon = document.createElement('span');
                sortIcon.className = 'sort-icon';
                sortIcon.innerHTML = '↕️';
                th.appendChild(sortIcon);
                
                th.addEventListener('click', () => {
                    const currentOrder = th.dataset.order === 'asc' ? 'desc' : 'asc';
                    this.sortTable(th.parentElement.parentElement.parentElement, index, currentOrder);
                    headers.forEach(h => {
                        h.classList.remove('sorted-asc', 'sorted-desc');
                        const icon = h.querySelector('.sort-icon');
                        if (icon) icon.innerHTML = '↕️';
                    });
                    th.classList.add(currentOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');
                    const icon = th.querySelector('.sort-icon');
                    if (icon) icon.innerHTML = currentOrder === 'asc' ? '↑' : '↓';
                    th.dataset.order = currentOrder;
                });
            }
        });
    },
    
    // ===== مرتب‌سازی جدول =====
    sortTable: function(table, columnIndex, order) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            const aValue = a.cells[columnIndex].textContent;
            const bValue = b.cells[columnIndex].textContent;
            
            if (order === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
        
        rows.forEach(row => tbody.appendChild(row));
    },
    
    // ===== ایجاد جدول نوبت‌ها =====
    createBookingsTable: function(bookings, onAction) {
        const columns = [
            { key: 'id', label: 'کد نوبت', sortable: true },
            { key: 'business.name', label: 'کسب‌وکار', sortable: true },
            { key: 'service.name', label: 'خدمت', sortable: true },
            { key: 'date', label: 'تاریخ', sortable: true, formatter: (value) => new Date(value).toLocaleDateString('fa-IR') },
            { key: 'time', label: 'ساعت', sortable: true },
            { key: 'finalPrice', label: 'مبلغ', sortable: true, formatter: (value) => PriceHelper.formatPrice(value) },
            { key: 'status', label: 'وضعیت', sortable: true, formatter: (value) => this.getStatusBadge(value) }
        ];
        
        const actions = [
            { label: 'مشاهده', variant: 'info', onClick: (row) => onAction('view', row) },
            { label: 'لغو', variant: 'danger', onClick: (row) => onAction('cancel', row) }
        ];
        
        return this.createTable({ columns, data: bookings, actions });
    },
    
    // ===== دریافت نشان وضعیت =====
    getStatusBadge: function(status) {
        const classes = {
            pending: 'status-pending',
            confirmed: 'status-confirmed',
            completed: 'status-completed',
            cancelled: 'status-cancelled'
        };
        const texts = {
            pending: 'در انتظار',
            confirmed: 'تأیید شده',
            completed: 'انجام شده',
            cancelled: 'لغو شده'
        };
        return `<span class="status-badge ${classes[status]}">${texts[status] || status}</span>`;
    }
};

// استایل‌های جدول
const tableStyles = `
<style>
.table-responsive {
    overflow-x: auto;
}
.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}
.data-table th,
.data-table td {
    padding: 0.75rem;
    text-align: right;
    border-bottom: 1px solid var(--border-color);
}
.data-table th {
    background: var(--bg-secondary);
    font-weight: 600;
}
.table-striped tbody tr:nth-child(odd) {
    background: var(--bg-secondary);
}
.table-hover tbody tr:hover {
    background: var(--bg-tertiary);
}
.table-bordered th,
.table-bordered td {
    border: 1px solid var(--border-color);
}
.sortable {
    cursor: pointer;
    user-select: none;
}
.sort-icon {
    margin-right: 0.25rem;
    font-size: 0.75rem;
}
.sorted-asc {
    background: var(--color-primary-soft);
}
.sorted-desc {
    background: var(--color-primary-soft);
}
.actions-cell {
    display: flex;
    gap: 0.5rem;
    white-space: nowrap;
}
.status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
}
.status-confirmed {
    background: var(--color-success-soft);
    color: var(--color-success);
}
.status-pending {
    background: var(--color-warning-soft);
    color: var(--color-warning);
}
.status-cancelled {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}
</style>
`;

if (!document.querySelector('#table-builder-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'table-builder-styles';
    styleSheet.textContent = tableStyles;
    document.head.appendChild(styleSheet);
}

window.TableBuilder = TableBuilder;
