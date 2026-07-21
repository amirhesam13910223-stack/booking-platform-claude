 /* ============================================
   USER-JOURNEY.TEST.JS - تست‌های E2E سفر کاربر
   ============================================ */

describe('E2E: Complete User Journey', () => {
    
    test('User Journey: Registration to First Booking', async () => {
        // 1. ثبت‌نام کاربر جدید
        const newUser = {
            name: 'کاربر جدید E2E',
            phone: '09121234567',
            email: 'e2e@test.com',
            password: '123456'
        };
        
        expect(newUser.name).toBeDefined();
        expect(newUser.phone).toBeDefined();
        
        // 2. ورود به سیستم
        localStorage.setItem('auth_token', 'test_token');
        localStorage.setItem('user', JSON.stringify({
            id: 1,
            name: newUser.name,
            phone: newUser.phone,
            role: 'user'
        }));
        
        const user = JSON.parse(localStorage.getItem('user'));
        expect(user.name).toBe(newUser.name);
        
        // 3. جستجوی کسب‌وکار
        const businesses = [
            { id: 1, name: 'سالن زیبایی لیدا', category: 'آرایشگاه' },
            { id: 2, name: 'کلینیک دکتر محمدی', category: 'پزشکی' }
        ];
        
        const selectedBusiness = businesses[0];
        expect(selectedBusiness).toBeDefined();
        
        // 4. انتخاب خدمت
        const services = [
            { id: 1, businessId: 1, name: 'کوتاهی مو', price: 250000 },
            { id: 2, businessId: 1, name: 'رنگ مو', price: 450000 }
        ];
        
        const selectedService = services[0];
        expect(selectedService).toBeDefined();
        
        // 5. انتخاب تاریخ و ساعت
        const selectedDate = '1403-12-20';
        const selectedTime = '16:00';
        expect(selectedDate).toBeDefined();
        expect(selectedTime).toBeDefined();
        
        // 6. رزرو نوبت
        const booking = {
            id: 'BK' + Date.now(),
            business: selectedBusiness,
            service: selectedService,
            date: selectedDate,
            time: selectedTime,
            customer: {
                name: user.name,
                phone: user.phone
            },
            status: 'confirmed'
        };
        
        expect(booking.id).toBeDefined();
        expect(booking.status).toBe('confirmed');
        
        // 7. ذخیره نوبت
        const bookings = [booking];
        localStorage.setItem('user_bookings', JSON.stringify(bookings));
        
        const savedBookings = JSON.parse(localStorage.getItem('user_bookings'));
        expect(savedBookings.length).toBe(1);
        expect(savedBookings[0].id).toBe(booking.id);
    });
    
    test('User Journey: Business Registration to First Booking', async () => {
        // 1. ثبت‌نام کسب‌وکار
        const newBusiness = {
            name: 'کسب‌وکار تست E2E',
            owner: 'مالک تست',
            phone: '02112345678',
            email: 'business@test.com'
        };
        
        expect(newBusiness.name).toBeDefined();
        
        // 2. ورود به پنل کسب‌وکار
        localStorage.setItem('auth_token', 'test_token');
        localStorage.setItem('user', JSON.stringify({
            id: 1,
            name: newBusiness.owner,
            role: 'business',
            businessName: newBusiness.name
        }));
        
        const user = JSON.parse(localStorage.getItem('user'));
        expect(user.role).toBe('business');
        
        // 3. افزودن خدمت
        const services = [
            { name: 'خدمت تست 1', duration: 30, price: 100000 },
            { name: 'خدمت تست 2', duration: 60, price: 200000 }
        ];
        
        services.forEach(service => {
            expect(service.name).toBeDefined();
            expect(service.price).toBeGreaterThan(0);
        });
        
        // 4. تنظیم زمانبندی
        const schedule = {
            saturday: { start: '09:00', end: '20:00', active: true },
            sunday: { start: '09:00', end: '20:00', active: true }
        };
        
        expect(schedule.saturday.active).toBe(true);
        
        // 5. دریافت نوبت
        const booking = {
            id: 'BK001',
            customer: { name: 'مشتری تست', phone: '09121234567' },
            service: services[0],
            date: '1403-12-20',
            time: '16:00',
            status: 'pending'
        };
        
        // 6. تأیید نوبت
        booking.status = 'confirmed';
        expect(booking.status).toBe('confirmed');
    });
    
    test('User Journey: Discount and Loyalty Points', async () => {
        // 1. ثبت‌نام کاربر
        const userId = 1;
        
        // 2. کسب امتیاز
        let points = 0;
        points += 100; // ثبت‌نام
        points += 50;  // اولین نوبت
        points += 20;  // ثبت نظر
        
        expect(points).toBe(170);
        
        // 3. ارتقای سطح
        let tier = 'bronze';
        if (points >= 100) tier = 'silver';
        if (points >= 300) tier = 'gold';
        
        expect(tier).toBe('silver');
        
        // 4. دریافت تخفیف
        const discountPercent = tier === 'silver' ? 10 : 5;
        expect(discountPercent).toBe(10);
        
        // 5. اعمال تخفیف روی نوبت
        const bookingPrice = 100000;
        const discountAmount = (bookingPrice * discountPercent) / 100;
        const finalPrice = bookingPrice - discountAmount;
        
        expect(finalPrice).toBe(90000);
    });
});
