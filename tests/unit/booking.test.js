 /* ============================================
   BOOKING.TEST.JS - تست‌های واحد ماژول رزرو نوبت
   ============================================ */

describe('Booking Module - Reservation', () => {
    let bookingReservation;
    
    beforeEach(() => {
        bookingReservation = window.BookingReservation;
        localStorage.clear();
    });
    
    test('should format price correctly', () => {
        const price = 250000;
        const formatted = bookingReservation.formatPrice(price);
        expect(formatted).toContain('۲۵۰٬۰۰۰');
        expect(formatted).toContain('تومان');
    });
    
    test('should format date correctly', () => {
        const date = '2024-03-20';
        const formatted = bookingReservation.formatDate(date);
        expect(formatted).toBeDefined();
    });
    
    test('should have businesses list defined', () => {
        expect(bookingReservation.businesses).toBeDefined();
        expect(bookingReservation.businesses.length).toBeGreaterThan(0);
    });
    
    test('should have services list defined', () => {
        expect(bookingReservation.services).toBeDefined();
        expect(bookingReservation.services.length).toBeGreaterThan(0);
    });
    
    test('should get available time slots', () => {
        const slots = bookingReservation.availableTimes;
        expect(slots).toBeDefined();
        expect(slots.length).toBeGreaterThan(0);
    });
});

describe('Booking Module - Cancellation', () => {
    let bookingCancellation;
    
    beforeEach(() => {
        bookingCancellation = window.BookingCancellation;
    });
    
    test('should calculate cancellation fee correctly for 48+ hours', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        const date = futureDate.toISOString().split('T')[0];
        const time = '10:00';
        
        const fee = bookingCancellation.calculateCancellationFee(date, time);
        expect(fee).toBe(0);
    });
    
    test('should calculate cancellation fee correctly for 24-48 hours', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1.5);
        const date = futureDate.toISOString().split('T')[0];
        const time = '10:00';
        
        const fee = bookingCancellation.calculateCancellationFee(date, time);
        expect(fee).toBe(25);
    });
    
    test('should check if booking can be cancelled', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);
        
        const booking = {
            date: futureDate.toISOString().split('T')[0],
            time: '10:00',
            status: 'confirmed'
        };
        
        const canCancel = bookingCancellation.canCancel(booking);
        expect(canCancel).toBe(true);
    });
    
    test('should not allow cancellation of past booking', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        
        const booking = {
            date: pastDate.toISOString().split('T')[0],
            time: '10:00',
            status: 'confirmed'
        };
        
        const canCancel = bookingCancellation.canCancel(booking);
        expect(canCancel).toBe(false);
    });
    
    test('should get remaining time string', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);
        
        const booking = {
            date: futureDate.toISOString().split('T')[0],
            time: '10:00'
        };
        
        const remaining = bookingCancellation.getRemainingTime(booking);
        expect(remaining).toContain('روز');
    });
});

describe('Booking Module - Reschedule', () => {
    let bookingReschedule;
    
    beforeEach(() => {
        bookingReschedule = window.BookingReschedule;
    });
    
    test('should check if booking can be rescheduled', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);
        
        const booking = {
            date: futureDate.toISOString().split('T')[0],
            time: '10:00',
            status: 'confirmed'
        };
        
        const canReschedule = bookingReschedule.canReschedule(booking);
        expect(canReschedule).toBe(true);
    });
    
    test('should not allow reschedule within 2 hours', () => {
        const nearDate = new Date();
        nearDate.setHours(nearDate.getHours() + 1);
        
        const booking = {
            date: nearDate.toISOString().split('T')[0],
            time: nearDate.toTimeString().slice(0, 5),
            status: 'confirmed'
        };
        
        const canReschedule = bookingReschedule.canReschedule(booking);
        expect(canReschedule).toBe(false);
    });
});
