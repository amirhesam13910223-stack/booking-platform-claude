 /* ============================================
   FORM-VALIDATOR.JS - اعتبارسنجی فرم‌ها
   ============================================ */

const FormValidator = {
    // قوانین اعتبارسنجی
    rules: {
        required: (value) => value !== null && value !== undefined && String(value).trim() !== '',
        minLength: (value, length) => String(value).length >= length,
        maxLength: (value, length) => String(value).length <= length,
        email: (value) => EmailValidator ? EmailValidator.isValid(value) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: (value) => PhoneValidator ? PhoneValidator.isValid(value) : /^09[0-9]{9}$/.test(value),
        nationalCode: (value) => NationalCodeValidator ? NationalCodeValidator.isValid(value) : true,
        number: (value) => !isNaN(Number(value)) && isFinite(value),
        integer: (value) => Number.isInteger(Number(value)),
        positive: (value) => Number(value) > 0,
        min: (value, min) => Number(value) >= min,
        max: (value, max) => Number(value) <= max,
        match: (value, fieldId) => {
            const otherField = document.getElementById(fieldId);
            return otherField && value === otherField.value;
        },
        pattern: (value, regex) => new RegExp(regex).test(value)
    },
    
    // پیام‌های خطا
    messages: {
        required: 'این فیلد الزامی است',
        minLength: 'حداقل طول باید {0} کاراکتر باشد',
        maxLength: 'حداکثر طول باید {0} کاراکتر باشد',
        email: 'ایمیل معتبر نیست',
        phone: 'شماره تماس معتبر نیست',
        nationalCode: 'کد ملی معتبر نیست',
        number: 'مقدار باید عدد باشد',
        integer: 'مقدار باید عدد صحیح باشد',
        positive: 'مقدار باید مثبت باشد',
        min: 'مقدار باید حداقل {0} باشد',
        max: 'مقدار باید حداکثر {0} باشد',
        match: 'مقدار با فیلد مورد نظر مطابقت ندارد',
        pattern: 'فرمت وارد شده معتبر نیست'
    },
    
    // ===== اعتبارسنجی فیلد =====
    validateField: function(field, rules) {
        const errors = [];
        const value = field.type === 'checkbox' ? field.checked : field.value;
        
        for (const rule of rules) {
            const [ruleName, param] = rule.split(':');
            const validator = this.rules[ruleName];
            
            if (validator && !validator(value, param)) {
                let message = this.messages[ruleName] || 'فیلد نامعتبر است';
                if (param) message = message.replace('{0}', param);
                errors.push(message);
            }
        }
        
        return errors;
    },
    
    // ===== اعتبارسنجی فرم =====
    validateForm: function(form, rulesMap) {
        const errors = {};
        let isValid = true;
        
        for (const [fieldName, rules] of Object.entries(rulesMap)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const fieldErrors = this.validateField(field, rules);
                if (fieldErrors.length > 0) {
                    errors[fieldName] = fieldErrors;
                    isValid = false;
                    this.showFieldError(field, fieldErrors[0]);
                } else {
                    this.clearFieldError(field);
                }
            }
        }
        
        return { isValid, errors };
    },
    
    // ===== نمایش خطای فیلد =====
    showFieldError: function(field, message) {
        field.classList.add('is-invalid');
        
        let errorDiv = field.parentElement.querySelector('.invalid-feedback');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            field.parentElement.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    },
    
    // ===== پاک کردن خطای فیلد =====
    clearFieldError: function(field) {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentElement.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    },
    
    // ===== پاک کردن خطاهای کل فرم =====
    clearFormErrors: function(form) {
        const fields = form.querySelectorAll('.is-invalid');
        fields.forEach(field => this.clearFieldError(field));
    },
    
    // ===== اعتبارسنجی بلادرنگ =====
    attachLiveValidation: function(form, rulesMap) {
        for (const [fieldName, rules] of Object.entries(rulesMap)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => {
                    const errors = this.validateField(field, rules);
                    if (errors.length > 0) {
                        this.showFieldError(field, errors[0]);
                    } else {
                        this.clearFieldError(field);
                    }
                });
                
                field.addEventListener('input', () => {
                    this.clearFieldError(field);
                });
            }
        }
    },
    
    // ===== اعتبارسنجی فرم لاگین =====
    validateLoginForm: function(username, password) {
        const errors = {};
        let isValid = true;
        
        if (!username) {
            errors.username = 'نام کاربری الزامی است';
            isValid = false;
        }
        
        if (!password) {
            errors.password = 'رمز عبور الزامی است';
            isValid = false;
        } else if (password.length < 6) {
            errors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
            isValid = false;
        }
        
        return { isValid, errors };
    },
    
    // ===== اعتبارسنجی فرم ثبت‌نام =====
    validateRegisterForm: function(data) {
        const errors = {};
        let isValid = true;
        
        if (!data.name) {
            errors.name = 'نام کامل الزامی است';
            isValid = false;
        } else if (data.name.length < 3) {
            errors.name = 'نام باید حداقل ۳ کاراکتر باشد';
            isValid = false;
        }
        
        if (!data.phone) {
            errors.phone = 'شماره تماس الزامی است';
            isValid = false;
        } else if (!PhoneValidator.isValid(data.phone)) {
            errors.phone = 'شماره تماس معتبر نیست';
            isValid = false;
        }
        
        if (data.email && !EmailValidator.isValid(data.email)) {
            errors.email = 'ایمیل معتبر نیست';
            isValid = false;
        }
        
        if (!data.password) {
            errors.password = 'رمز عبور الزامی است';
            isValid = false;
        } else if (data.password.length < 6) {
            errors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
            isValid = false;
        }
        
        if (data.password !== data.passwordConfirm) {
            errors.passwordConfirm = 'رمز عبور و تکرار آن مطابقت ندارند';
            isValid = false;
        }
        
        return { isValid, errors };
    },
    
    // ===== اعتبارسنجی فرم رزرو =====
    validateBookingForm: function(bookingData) {
        const errors = {};
        let isValid = true;
        
        if (!bookingData.businessId) {
            errors.business = 'انتخاب کسب‌وکار الزامی است';
            isValid = false;
        }
        
        if (!bookingData.serviceId) {
            errors.service = 'انتخاب خدمت الزامی است';
            isValid = false;
        }
        
        if (!bookingData.date) {
            errors.date = 'انتخاب تاریخ الزامی است';
            isValid = false;
        }
        
        if (!bookingData.time) {
            errors.time = 'انتخاب ساعت الزامی است';
            isValid = false;
        }
        
        return { isValid, errors };
    }
};

window.FormValidator = FormValidator;
