 /* ============================================
   DRAG-DROP.JS - قابلیت درگ و دراپ
   ============================================ */

const DragDropManager = {
    // عنصر در حال درگ
    draggedItem: null,
    
    // تنظیمات
    config: {
        dragClass: 'dragging',
        dragOverClass: 'drag-over',
        dropZoneClass: 'drop-zone'
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachGlobalEvents();
        console.log('🖱️ Drag & Drop Manager راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادهای سراسری =====
    attachGlobalEvents: function() {
        document.addEventListener('dragstart', (e) => this.handleDragStart(e));
        document.addEventListener('dragend', (e) => this.handleDragEnd(e));
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        document.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
    },
    
    // ===== تنظیم عنصر قابل درگ =====
    makeDraggable: function(element, options = {}) {
        const {
            data = {},
            onDragStart = null,
            onDragEnd = null,
            dragImage = null
        } = options;
        
        element.setAttribute('draggable', 'true');
        element.setAttribute('data-drag-data', JSON.stringify(data));
        
        if (dragImage) {
            element.addEventListener('dragstart', (e) => {
                e.dataTransfer.setDragImage(dragImage, 0, 0);
            });
        }
        
        if (onDragStart) {
            element.addEventListener('dragstart', onDragStart);
        }
        
        if (onDragEnd) {
            element.addEventListener('dragend', onDragEnd);
        }
        
        return element;
    },
    
    // ===== تنظیم منطقه قابل دراپ =====
    makeDropZone: function(element, options = {}) {
        const {
            onDragEnter = null,
            onDragLeave = null,
            onDrop = null,
            acceptTypes = []
        } = options;
        
        element.classList.add(this.config.dropZoneClass);
        
        if (onDragEnter) {
            element.addEventListener('dragenter', onDragEnter);
        }
        
        if (onDragLeave) {
            element.addEventListener('dragleave', onDragLeave);
        }
        
        if (onDrop) {
            element.addEventListener('drop', (e) => {
                e.preventDefault();
                const data = this.getDragData(e);
                onDrop(data, e);
            });
        }
        
        return element;
    },
    
    // ===== هندلر شروع درگ =====
    handleDragStart: function(e) {
        this.draggedItem = e.target.closest('[draggable="true"]');
        if (!this.draggedItem) return;
        
        this.draggedItem.classList.add(this.config.dragClass);
        
        const dragData = this.draggedItem.getAttribute('data-drag-data');
        if (dragData) {
            e.dataTransfer.setData('text/plain', dragData);
        }
        
        e.dataTransfer.effectAllowed = 'move';
    },
    
    // ===== هندلر پایان درگ =====
    handleDragEnd: function(e) {
        if (this.draggedItem) {
            this.draggedItem.classList.remove(this.config.dragClass);
            this.draggedItem = null;
        }
        
        document.querySelectorAll(`.${this.config.dragOverClass}`).forEach(el => {
            el.classList.remove(this.config.dragOverClass);
        });
    },
    
    // ===== هندلر حرکت روی عنصر =====
    handleDragOver: function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },
    
    // ===== هندلر ورود به عنصر =====
    handleDragEnter: function(e) {
        const target = e.target.closest(`.${this.config.dropZoneClass}`);
        if (target && target !== this.draggedItem) {
            target.classList.add(this.config.dragOverClass);
        }
    },
    
    // ===== هندلر خروج از عنصر =====
    handleDragLeave: function(e) {
        const target = e.target.closest(`.${this.config.dropZoneClass}`);
        if (target) {
            target.classList.remove(this.config.dragOverClass);
        }
    },
    
    // ===== هندلر رها کردن =====
    handleDrop: function(e) {
        e.preventDefault();
        
        const target = e.target.closest(`.${this.config.dropZoneClass}`);
        if (target) {
            target.classList.remove(this.config.dragOverClass);
            
            const dragData = this.getDragData(e);
            const dropEvent = new CustomEvent('drop:complete', {
                detail: {
                    draggedItem: this.draggedItem,
                    dropTarget: target,
                    data: dragData
                }
            });
            target.dispatchEvent(dropEvent);
        }
    },
    
    // ===== دریافت داده درگ =====
    getDragData: function(e) {
        const dataText = e.dataTransfer.getData('text/plain');
        if (dataText) {
            try {
                return JSON.parse(dataText);
            } catch(e) {
                return dataText;
            }
        }
        return null;
    },
    
    // ===== مرتب‌سازی لیست با درگ =====
    makeSortableList: function(listElement, options = {}) {
        const {
            onReorder = null,
            itemSelector = 'li',
            handleSelector = null
        } = options;
        
        const items = listElement.querySelectorAll(itemSelector);
        
        items.forEach(item => {
            let dragHandle = item;
            if (handleSelector) {
                const handle = item.querySelector(handleSelector);
                if (handle) dragHandle = handle;
            }
            
            this.makeDraggable(dragHandle, {
                data: { id: item.dataset.id || item.id, index: Array.from(items).indexOf(item) }
            });
        });
        
        this.makeDropZone(listElement, {
            onDrop: (data, e) => {
                const draggedId = data?.id;
                const targetElement = e.target.closest(itemSelector);
                
                if (draggedId && targetElement && draggedId !== targetElement.dataset.id) {
                    if (onReorder) {
                        onReorder(draggedId, targetElement.dataset.id);
                    }
                }
            }
        });
        
        return listElement;
    },
    
    // ===== مرتب‌سازی جدول با درگ =====
    makeSortableTable: function(tableElement, options = {}) {
        const {
            onReorder = null,
            rowSelector = 'tbody tr'
        } = options;
        
        const rows = tableElement.querySelectorAll(rowSelector);
        
        rows.forEach(row => {
            this.makeDraggable(row, {
                data: { id: row.dataset.id, index: Array.from(rows).indexOf(row) }
            });
        });
        
        this.makeDropZone(tableElement.querySelector('tbody'), {
            onDrop: (data, e) => {
                const draggedId = data?.id;
                const targetRow = e.target.closest(rowSelector);
                
                if (draggedId && targetRow && draggedId !== targetRow.dataset.id) {
                    if (onReorder) {
                        onReorder(draggedId, targetRow.dataset.id);
                    }
                }
            }
        });
        
        return tableElement;
    },
    
    // ===== آپلود فایل با درگ =====
    createDragDropUpload: function(zoneElement, options = {}) {
        const {
            onFileSelect = null,
            onUpload = null,
            accept = 'image/*',
            multiple = false
        } = options;
        
        this.makeDropZone(zoneElement, {
            onDrop: (data, e) => {
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                    if (onFileSelect) onFileSelect(files);
                    if (onUpload) onUpload(files);
                }
            }
        });
        
        zoneElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            zoneElement.classList.add('drag-over');
        });
        
        zoneElement.addEventListener('dragleave', () => {
            zoneElement.classList.remove('drag-over');
        });
        
        return zoneElement;
    }
};

// استایل‌های درگ و دراپ
const dragDropStyles = `
<style>
[draggable="true"] {
    cursor: grab;
    user-select: none;
}
[draggable="true"]:active {
    cursor: grabbing;
}
.dragging {
    opacity: 0.5;
    cursor: grabbing;
}
.drop-zone {
    transition: all 0.2s ease;
}
.drop-zone.drag-over {
    background: var(--color-primary-soft);
    border: 2px dashed var(--color-primary);
}
.drag-drop-upload {
    border: 2px dashed var(--border-color);
    border-radius: var(--radius-lg);
    padding: 2rem;
    text-align: center;
    transition: all 0.2s ease;
    cursor: pointer;
}
.drag-drop-upload.drag-over {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
}
</style>
`;

if (!document.querySelector('#dragdrop-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dragdrop-styles';
    styleSheet.textContent = dragDropStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    DragDropManager.init();
});

window.DragDropManager = DragDropManager;
