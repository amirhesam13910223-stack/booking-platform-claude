 /* ============================================
   FORM-BUILDER.JS - ساخت فرم‌ها
   ============================================ */

const FormBuilder = {
    // انواع فیلدها
    fieldTypes: {
        text: 'text',
        email: 'email',
        password: 'password',
        number: 'number',
        tel: 'tel',
        textarea: 'textarea',
        select: 'select',
        checkbox: 'checkbox',
        radio: 'radio',
        date: 'date',
        time: 'time',
        datetime: 'datetime-local',
        file: 'file'
    },
    
    // ===== ایجاد فرم =====
    createForm: function(options = {}) {
        const {
            id = null,
            className = '',
            method = 'POST',
            action = '',
            fields = [],
            buttons = [],
            onSubmit = null
        } = options;
        
        const form = document.createElement('form');
        if (id) form.id = id;
        form.className = `form ${className}`;
        form.method = method;
        if (action) form.action = action;
        
        // افزودن فیلدها
        fields.forEach(field => {
            const fieldGroup = this.createField(field);
            form.appendChild(fieldGroup);
        });
        
        // افزودن دکمه‌ها
        if (buttons.length > 0) {
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'form-buttons';
            
            buttons.forEach(btn => {
                const button = ButtonFactory.create(btn);
                buttonGroup.appendChild(button);
            });
            
            form.appendChild(buttonGroup);
        }
        
        if (onSubmit) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                onSubmit(this.getFormData(form));
            });
        }
        
        return form;
    },
    
    // ===== ایجاد فیلد =====
    createField: function(options = {}) {
        const {
            name,
            label,
            type = 'text',
            placeholder = '',
            required = false,
            value = '',
            options: selectOptions = [],
            rows = 3,
            min = null,
            max = null,
            step = null,
            accept = null,
            multiple = false,
            help = null,
            className = ''
        } = options;
        
        const group = document.createElement('div');
        group.className = `form-group ${className}`;
        
        // لیبل
        if (label) {
            const labelEl = document.createElement('label');
            labelEl.setAttribute('for', name);
            labelEl.textContent = label;
            if (required) {
                const requiredStar = document.createElement('span');
                requiredStar.className = 'required-star';
                requiredStar.textContent = '*';
                labelEl.appendChild(requiredStar);
            }
            group.appendChild(labelEl);
        }
        
        // فیلد ورودی
        let field;
        
        if (type === 'textarea') {
            field = document.createElement('textarea');
            field.rows = rows;
            field.textContent = value;
        } else if (type === 'select') {
            field = document.createElement('select');
            selectOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (opt.value === value) option.selected = true;
                field.appendChild(option);
            });
        } else if (type === 'checkbox' || type === 'radio') {
            field = document.createElement('input');
            field.type = type;
            field.checked = value === true || value === 'true';
            field.value = value;
        } else {
            field = document.createElement('input');
            field.type = type;
            field.value = value;
        }
        
        field.name = name;
        field.id = name;
        if (placeholder && type !== 'checkbox' && type !== 'radio') field.placeholder = placeholder;
        if (required) field.required = true;
        if (min !== null) field.min = min;
        if (max !== null) field.max = max;
        if (step !== null) field.step = step;
        if (accept && type === 'file') field.accept = accept;
        if (multiple && type === 'file') field.multiple = true;
        
        group.appendChild(field);
        
        // راهنما
        if (help) {
            const helpEl = document.createElement('small');
            helpEl.className = 'form-help';
            helpEl.textContent = help;
            group.appendChild(helpEl);
        }
        
        return group;
    },
    
    // ===== دریافت داده‌های فرم =====
    getFormData: function(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (data[key] !== undefined) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
        
        return data;
    },
    
    // ===== پر کردن فرم =====
    populateForm: function(form, data) {
        for (const [key, value] of Object.entries(data)) {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = field.value === value;
                } else {
                    field.value = value;
                }
            }
        }
    },
    
    // ===== ریست فرم =====
    resetForm: function(form) {
        form.reset();
        const errors = form.querySelectorAll('.is-invalid');
        errors.forEach(error => error.classList.remove('is-invalid'));
        const feedbacks = form.querySelectorAll('.invalid-feedback');
        feedbacks.forEach(feedback => feedback.remove());
    },
    
    // ===== اعتبارسنجی فرم =====
    validateForm: function(form, rules) {
        let isValid = true;
        const errors = {};
        
        for (const [fieldName, fieldRules] of Object.entries(rules)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const value = field.type === 'checkbox' ? field.checked : field.value;
                const fieldErrors = [];
                
                for (const rule of fieldRules) {
                    const [ruleName, param] = rule.split(':');
                    if (!this.validateField(value, ruleName, param)) {
                        fieldErrors.push(this.getErrorMessage(ruleName, param));
                        field.classList.add('is-invalid');
                        isValid = false;
                    } else {
                        field.classList.remove('is-invalid');
                    }
                }
                
                if (fieldErrors.length > 0) {
                    errors[fieldName] = fieldErrors;
                    this.showFieldError(field, fieldErrors[0]);
                }
            }
        }
        
        return { isValid, errors };
    },
    
    // ===== اعتبارسنجی فیلد =====
    validateField: function(value, rule, param) {
        switch(rule) {
            case 'required': return value !== null && value !== undefined && value !== '';
            case 'minLength': return String(value).length >= parseInt(param);
            case 'maxLength': return String(value).length <= parseInt(param);
            case 'email': return EmailValidator.isValid(value);
            case 'phone': return PhoneValidator.isValid(value);
            case 'number': return !isNaN(Number(value));
            case 'min': return Number(value) >= parseFloat(param);
            case 'max': return Number(value) <= parseFloat(param);
            default: return true;
        }
    },
    
    // ===== نمایش خطای فیلد =====
    showFieldError: function(field, message) {
        let errorDiv = field.parentElement.querySelector('.invalid-feedback');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            field.parentElement.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    },
    
    // ===== دریافت پیام خطا =====
    getErrorMessage: function(rule, param) {
        const messages = {
            required: 'این فیلد الزامی است',
            minLength: `حداقل ${param} کاراکتر وارد کنید`,
            maxLength: `حداکثر ${param} کاراکتر وارد کنید`,
            email: 'ایمیل معتبر نیست',
            phone: 'شماره تماس معتبر نیست',
            number: 'مقدار باید عدد باشد',
            min: `مقدار باید حداقل ${param} باشد`,
            max: `مقدار باید حداکثر ${param} باشد`
        };
        return messages[rule] || 'مقدار نامعتبر است';
    }
};

window.FormBuilder = FormBuilder;
