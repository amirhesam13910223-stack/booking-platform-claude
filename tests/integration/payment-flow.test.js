 /* ============================================
   PAYMENT-FLOW.TEST.JS - تست‌های یکپارچه جریان پرداخت
   ============================================ */

describe('Integration: Complete Payment Flow', () => {
    let testUser;
    let wallet;
    
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        
        // ایجاد کاربر تست
        testUser = {
            id: 1,
            name: 'کاربر تست',
            phone: '09121234567'
        };
        localStorage.setItem('user', JSON.stringify(testUser));
        
        // راه‌اندازی کیف پول
        wallet = window.WalletSystem;
        wallet.createNewWallet();
    });
    
    test('should charge wallet and verify balance', async () => {
        const initialBalance = wallet.getBalance();
        const chargeAmount = 100000;
        
        // شارژ کیف پول
        wallet.currentWallet.balance = initialBalance + chargeAmount;
        wallet.addTransaction('charge', chargeAmount, 'شارژ کیف پول');
        wallet.saveWallet();
        
        // بررسی
        expect(wallet.getBalance()).toBe(initialBalance + chargeAmount);
    });
    
    test('should pay with wallet successfully', () => {
        // شارژ کیف پول
        wallet.currentWallet.balance = 100000;
        wallet.saveWallet();
        
        const paymentAmount = 50000;
        const initialBalance = wallet.getBalance();
        
        // پرداخت با کیف پول
        const success = wallet.withdrawFromWallet({
            amount: paymentAmount,
            description: 'پرداخت نوبت'
        });
        
        expect(success).toBe(true);
        expect(wallet.getBalance()).toBe(initialBalance - paymentAmount);
    });
    
    test('should fail payment when balance insufficient', () => {
        wallet.currentWallet.balance = 30000;
        wallet.saveWallet();
        
        const paymentAmount = 50000;
        const initialBalance = wallet.getBalance();
        
        const success = wallet.withdrawFromWallet({
            amount: paymentAmount,
            description: 'پرداخت نوبت'
        });
        
        expect(success).toBe(false);
        expect(wallet.getBalance()).toBe(initialBalance);
    });
    
    test('should process payment via gateway', async () => {
        const paymentGateway = window.PaymentGatewayHandler;
        
        const transaction = await paymentGateway.createTransaction({
            amount: 100000,
            description: 'Test payment',
            gateway: 'zarinpal'
        });
        
        expect(transaction).toBeDefined();
        expect(transaction.id).toBeDefined();
        expect(transaction.amount).toBe(100000);
    });
    
    test('should complete full payment and booking flow', async () => {
        // 1. شارژ کیف پول
        wallet.currentWallet.balance = 200000;
        wallet.saveWallet();
        expect(wallet.getBalance()).toBe(200000);
        
        // 2. ایجاد نوبت
        const bookingPrice = 150000;
        const booking = {
            id: 'BK001',
            finalPrice: bookingPrice,
            status: 'pending'
        };
        
        // 3. پرداخت
        const success = wallet.withdrawFromWallet({
            amount: bookingPrice,
            description: `پرداخت نوبت ${booking.id}`
        });
        
        expect(success).toBe(true);
        expect(wallet.getBalance()).toBe(50000);
        
        // 4. تأیید نوبت
        booking.status = 'confirmed';
        expect(booking.status).toBe('confirmed');
    });
});
