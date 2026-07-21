 /* ============================================
   MODAL-FACTORY.JS - ساخت مودال‌ها
   ============================================ */

const ModalFactory = {
    // مودال فعال فعلی
    activeModal: null,
    
    // ===== ایجاد مودال =====
    createModal: function(options = {}) {
        const {
            title = '',
            content = '',
            size = 'md', // sm, md, lg, xl, full
            closeOnBackdrop = true,
            closeOnEsc = true,
            showClose = true,
            footer = null,
            onOpen = null,
            onClose = null
        } = options;
        
        // حذف مودال قبلی اگر وجود دارد
        if (this.activeModal) {
            this.closeModal();
        }
        
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        
        const modal = document.createElement('div');
        modal.className = `modal modal-${size}`;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // هدر
        if (title || showClose) {
            const header = document.createElement('div');
            header.className = 'modal-header';
            
            if (title) {
                const titleEl = document.createElement('h3');
                titleEl.className = 'modal-title';
                titleEl.textContent = title;
                header.appendChild(titleEl);
            }
            
            if (showClose) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'modal-close';
                closeBtn.innerHTML = '&times;';
                closeBtn.addEventListener('click', () => this.closeModal());
                header.appendChild(closeBtn);
            }
            
            modalContent.appendChild(header);
        }
        
        // بدنه
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }
        
        modalContent.appendChild(body);
        
        // فوتر
        if (footer) {
            const footerEl = document.createElement('div');
            footerEl.className = 'modal-footer';
            
            if (typeof footer === 'string') {
                footerEl.innerHTML = footer;
            } else {
                footerEl.appendChild(footer);
            }
            
            modalContent.appendChild(footerEl);
        }
        
        modal.appendChild(modalContent);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        
        this.activeModal = { backdrop, modal, onClose };
        
        // رویدادها
        if (closeOnBackdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) this.closeModal();
            });
        }
        
        if (closeOnEsc) {
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
            modal.escHandler = escHandler;
        }
        
        // انیمیشن باز شدن
        setTimeout(() => backdrop.classList.add('show'), 10);
        
        if (onOpen) onOpen(modal);
        
        return modal;
    },
    
    // ===== بستن مودال =====
    closeModal: function() {
        if (this.activeModal) {
            const { backdrop, onClose } = this.activeModal;
            
            backdrop.classList.remove('show');
            
            setTimeout(() => {
                backdrop.remove();
                if (onClose) onClose();
                this.activeModal = null;
            }, 300);
        }
    },
    
    // ===== ایجاد مودال تأیید =====
    createConfirmModal: function(options = {}) {
        const {
            title = 'تأیید',
            message = 'آیا از انجام این عملیات مطمئن هستید؟',
            confirmText = 'تأیید',
            cancelText = 'انصراف',
            onConfirm = null,
            onCancel = null,
            variant = 'primary'
        } = options;
        
        const footer = document.createElement('div');
        footer.style.display = 'flex';
        footer.style.gap = '10px';
        footer.style.justifyContent = 'flex-end';
        
        const cancelBtn = ButtonFactory.create({
            text: cancelText,
            variant: 'outline',
            onClick: () => {
                this.closeModal();
                if (onCancel) onCancel();
            }
        });
        
        const confirmBtn = ButtonFactory.create({
            text: confirmText,
            variant: variant,
            onClick: () => {
                this.closeModal();
                if (onConfirm) onConfirm();
            }
        });
        
        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);
        
        return this.createModal({
            title: title,
            content: `<p>${message}</p>`,
            footer: footer
        });
    },
    
    // ===== ایجاد مودال هشدار =====
    createAlertModal: function(options = {}) {
        const {
            title = 'هشدار',
            message = '',
            type = 'info', // info, success, warning, error
            buttonText = 'متوجه شدم',
            onClose = null
        } = options;
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        const footer = document.createElement('div');
        footer.style.display = 'flex';
        footer.style.justifyContent = 'center';
        
        const okBtn = ButtonFactory.create({
            text: buttonText,
            variant: type === 'error' ? 'danger' : 'primary',
            onClick: () => {
                this.closeModal();
                if (onClose) onClose();
            }
        });
        
        footer.appendChild(okBtn);
        
        return this.createModal({
            title: title,
            content: `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">${icons[type]}</div>
                    <p>${message}</p>
                </div>
            `,
            footer: footer
        });
    },
    
    // ===== ایجاد مودال فرم =====
    createFormModal: function(options = {}) {
        const {
            title = 'فرم',
            fields = [],
            submitText = 'ذخیره',
            cancelText = 'انصراف',
            onSubmit = null,
            initialData = {}
        } = options;
        
        const form = FormBuilder.createForm({
            fields: fields,
            buttons: [],
            onSubmit: (data) => {
                this.closeModal();
                if (onSubmit) onSubmit(data);
            }
        });
        
        if (initialData) {
            FormBuilder.populateForm(form, initialData);
        }
        
        const footer = document.createElement('div');
        footer.style.display = 'flex';
        footer.style.gap = '10px';
        footer.style.justifyContent = 'flex-end';
        
        const cancelBtn = ButtonFactory.create({
            text: cancelText,
            variant: 'outline',
            onClick: () => this.closeModal()
        });
        
        const submitBtn = ButtonFactory.create({
            text: submitText,
            variant: 'primary',
            type: 'submit'
        });
        
        footer.appendChild(cancelBtn);
        footer.appendChild(submitBtn);
        
        form.appendChild(footer);
        
        return this.createModal({
            title: title,
            content: form,
            onClose: () => this.closeModal()
        });
    },
    
    // ===== ایجاد مودال لودینگ =====
    createLoadingModal: function(message = 'در حال بارگذاری...') {
        return this.createModal({
            title: '',
            content: `
                <div style="text-align: center; padding: 30px;">
                    <div class="spinner-border" style="width: 3rem; height: 3rem;"></div>
                    <p style="margin-top: 16px;">${message}</p>
                </div>
            `,
            showClose: false,
            closeOnBackdrop: false,
            closeOnEsc: false
        });
    }
};

window.ModalFactory = ModalFactory;
