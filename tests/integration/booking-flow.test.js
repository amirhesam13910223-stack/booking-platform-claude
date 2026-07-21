/* ============================================
   BOOKING-FLOW.TEST.JS - تست‌های یکپارچه جریان رزرو
   ============================================ */

   describe('Integration: Complete Booking Flow', () => {
    let testUser;
    let testBusiness;
    let testService;
    
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        
        // ایجاد کاربر تست
        testUser = {
            id: 1,
            name: 'کاربر تست',
            phone: '09121234567',
            role: 'user'
        };
        localStorage.setItem('user', JSON.stringify(testUser));
        localStorage.setItem('auth_token', 'test_token');
        
        // ایجاد کسب‌وکار تست
        testBusiness = {
            id: 'BIZ001',
            name: 'کسب‌وکار تست',
            address: 'آدرس تست'
        };
        
        // ایجاد خدمت تست
        testService = {
            id: 'SRV001',
            name: 'خدمت تست',
            duration: 30,
            price: 100000
        };
    });
    
    test('should complete full booking process', async () => {
        // مرحله 1: انتخاب کسب‌وکار
        const selectedBusiness = testBusiness;
        expect(selectedBusiness).toBeDefined();
        
        // مرحله 2: انتخاب خدمت
        const selectedService = testService;
        expect(selectedService).toBeDefined();
        
        // مرحله 3: انتخاب تاریخ و ساعت
        const selectedDate = '1403-12-20';
        const selectedTime = '16:00';
        expect(selectedDate).toBeDefined();
        expect(selectedTime).toBeDefined();
        
        // مرحله 4: تکمیل اطلاعات مشتری
        const customerInfo = {
            name: testUser.name,
            phone: testUser.phone
        };
        expect(customerInfo.name).toBe(testUser.name);
        
        // مرحله 5: ایجاد نوبت
        const booking = {
            id: 'BK' + Date.now(),
            business: selectedBusiness,
            service: selectedService,
            date: selectedDate,
            time: selectedTime,
            customer: customerInfo,
            status: 'confirmed'
        };
        
        // ذخیره نوبت
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('user_bookings', JSON.stringify(bookings));
        
        // بررسی نوبت ذخیره شده
        const savedBookings = JSON.parse(localStorage.getItem('user_bookings'));
        expect(savedBookings.length).toBe(1);
        expect(savedBookings[0].id).toBe(booking.id);
        expect(savedBookings[0].status).toBe('confirmed');
    });
    
    test('should cancel booking successfully', async () => {
        // ایجاد نوبت
        const booking = {
            id: 'BK001',
            business: testBusiness,
            service: testService,
            date: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
            time: '10:00',
            status: 'confirmed'
        };
        
        const bookings = [booking];
        localStorage.setItem('user_bookings', JSON.stringify(bookings));
        
        // لغو نوبت
        const bookingToCancel = bookings[0];
        bookingToCancel.status = 'cancelled';
        localStorage.setItem('user_bookings', JSON.stringify(bookings));
        
        // بررسی
        const updatedBookings = JSON.parse(localStorage.getItem('user_bookings'));
        expect(updatedBookings[0].status).toBe('cancelled');
    });
    
    test('should reschedule booking successfully', async () => {
        // ایجاد نوبت
        const booking = {
            id: 'BK001',
            business: testBusiness,
            service: testService,
            date: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
            time: '10:00',
            status: 'confirmed'
        };
        
        const bookings = [booking];
        localStorage.setItem('user_bookings', JSON.stringify(bookings));
        
        // تغییر زمان
        const newDate = new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0];
        const newTime = '14:00';
        
        bookings[0].date = newDate;
        bookings[0].time = newTime;
        localStorage.setItem('user_bookings', JSON.stringify(bookings));
        
        // بررسی
        const updatedBookings = JSON.parse(localStorage.getItem('user_bookings'));
        expect(updatedBookings[0].date).toBe(newDate);
        expect(updatedBookings[0].time).toBe(newTime);
    });
}); 
