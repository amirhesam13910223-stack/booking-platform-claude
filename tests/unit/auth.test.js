 /* ============================================
   AUTH.TEST.JS - تست‌های واحد ماژول احراز هویت
   ============================================ */

// تست‌های مربوط به ورود به سیستم
describe('Auth Module - Login', () => {
    let authLogin;
    
    beforeEach(() => {
        // راه‌اندازی اولیه قبل از هر تست
        authLogin = window.AuthLogin;
        localStorage.clear();
        sessionStorage.clear();
    });
    
    test('should validate login form with valid data', () => {
        const username = '09121234567';
        const password = '123456';
        
        const isValid = authLogin.validateForm(username, password);
        expect(isValid).toBe(true);
    });
    
    test('should reject login form with empty username', () => {
        const username = '';
        const password = '123456';
        
        const isValid = authLogin.validateForm(username, password);
        expect(isValid).toBe(false);
    });
    
    test('should reject login form with short password', () => {
        const username = '09121234567';
        const password = '123';
        
        const isValid = authLogin.validateForm(username, password);
        expect(isValid).toBe(false);
    });
    
    test('should successfully login with correct credentials', async () => {
        const username = '09121234567';
        const password = '123456';
        
        const response = await authLogin.authenticateUser(username, password, false);
        expect(response.success).toBe(true);
        expect(response.user).toBeDefined();
        expect(response.user.phone).toBe(username);
    });
    
    test('should fail login with incorrect credentials', async () => {
        const username = '09121234567';
        const password = 'wrongpassword';
        
        const response = await authLogin.authenticateUser(username, password, false);
        expect(response.success).toBe(false);
        expect(response.message).toBeDefined();
    });
    
    test('should store token in localStorage when remember is true', async () => {
        const username = '09121234567';
        const password = '123456';
        
        await authLogin.authenticateUser(username, password, true);
        const token = localStorage.getItem('auth_token');
        expect(token).not.toBeNull();
    });
    
    test('should store token in sessionStorage when remember is false', async () => {
        const username = '09121234567';
        const password = '123456';
        
        await authLogin.authenticateUser(username, password, false);
        const token = sessionStorage.getItem('auth_token');
        expect(token).not.toBeNull();
    });
});

// تست‌های مربوط به ثبت‌نام
describe('Auth Module - Register', () => {
    let authRegister;
    
    beforeEach(() => {
        authRegister = window.AuthRegister;
        localStorage.clear();
    });
    
    test('should validate registration form with valid data', () => {
        const fullName = 'کاربر تست';
        const phone = '09121234567';
        const password = '123456';
        const passwordConfirm = '123456';
        const termsAccepted = true;
        
        const isValid = authRegister.validateForm(fullName, phone, password, passwordConfirm, termsAccepted);
        expect(isValid).toBe(true);
    });
    
    test('should reject registration with short name', () => {
        const fullName = 'ع';
        const phone = '09121234567';
        const password = '123456';
        const passwordConfirm = '123456';
        const termsAccepted = true;
        
        const isValid = authRegister.validateForm(fullName, phone, password, passwordConfirm, termsAccepted);
        expect(isValid).toBe(false);
    });
    
    test('should reject registration with invalid phone', () => {
        const fullName = 'کاربر تست';
        const phone = '123456';
        const password = '123456';
        const passwordConfirm = '123456';
        const termsAccepted = true;
        
        const isValid = authRegister.validateForm(fullName, phone, password, passwordConfirm, termsAccepted);
        expect(isValid).toBe(false);
    });
    
    test('should reject registration with mismatched passwords', () => {
        const fullName = 'کاربر تست';
        const phone = '09121234567';
        const password = '123456';
        const passwordConfirm = '123';
        const termsAccepted = true;
        
        const isValid = authRegister.validateForm(fullName, phone, password, passwordConfirm, termsAccepted);
        expect(isValid).toBe(false);
    });
    
    test('should reject registration without accepting terms', () => {
        const fullName = 'کاربر تست';
        const phone = '09121234567';
        const password = '123456';
        const passwordConfirm = '123456';
        const termsAccepted = false;
        
        const isValid = authRegister.validateForm(fullName, phone, password, passwordConfirm, termsAccepted);
        expect(isValid).toBe(false);
    });
    
    test('should successfully register a new user', async () => {
        const fullName = 'کاربر جدید';
        const phone = '09129999999';
        const email = 'newuser@test.com';
        const password = '123456';
        
        const response = await authRegister.registerUser(fullName, phone, email, password);
        expect(response.success).toBe(true);
        expect(response.user).toBeDefined();
        expect(response.user.name).toBe(fullName);
    });
});

// تست‌های مربوط به خروج از سیستم
describe('Auth Module - Logout', () => {
    let authSession;
    
    beforeEach(() => {
        authSession = window.AuthSession;
        localStorage.clear();
        sessionStorage.clear();
    });
    
    test('should clear tokens on logout', async () => {
        localStorage.setItem('auth_token', 'test_token');
        sessionStorage.setItem('auth_token', 'test_token');
        
        await authSession.logout();
        
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(sessionStorage.getItem('auth_token')).toBeNull();
    });
    
    test('should clear user data on logout', async () => {
        localStorage.setItem('user', JSON.stringify({ name: 'Test User' }));
        
        await authSession.logout();
        
        expect(localStorage.getItem('user')).toBeNull();
    });
});
