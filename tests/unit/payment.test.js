 /* ============================================
   PAYMENT.TEST.JS - تست‌های واحد ماژول پرداخت
   ============================================ */

describe('Payment Module - Gateway Handler', () => {
    let paymentGateway;
    
    beforeEach(() => {
        paymentGateway = window.PaymentGatewayHandler;
        localStorage.clear();
    });
    
    test('should have active gateways defined', () => {
        const gateways = paymentGateway.getGateways();
        expect(gateways).toBeDefined();
        expect(gateways.length).toBeGreaterThan(0);
    });
    
    test('should create transaction', async () => {
        const transaction = await paymentGateway.createTransaction({
            amount: 100000,
            description: 'Test payment',
            gateway: 'zarinpal'
        });
        
        expect(transaction).toBeDefined();
        expect(transaction.id).toBeDefined();
        expect(transaction.amount).toBe(100000);
        expect(transaction.status).toBe('pending');
    });
    
    test('should save transaction to localStorage', async () => {
        const transaction = await paymentGateway.createTransaction({
            amount: 100000,
            description: 'Test payment',
            gateway: 'zarinpal'
        });
        
        paymentGateway.saveTransaction(transaction);
        const saved = paymentGateway.getTransaction(transaction.id);
        
        expect(saved).toBeDefined();
        expect(saved.id).toBe(transaction.id);
    });
    
    test('should update transaction status', async () => {
        const transaction = await paymentGateway.createTransaction({
            amount: 100000,
            description: 'Test payment',
            gateway: 'zarinpal'
        });
        
        paymentGateway.saveTransaction(transaction);
        const updated = paymentGateway.updateTransaction(transaction.id, { status: 'success' });
        
        expect(updated.status).toBe('success');
    });
});

describe('Payment Module - Zarinpal Gateway', () => {
    let zarinpal;
    
    beforeEach(() => {
        zarinpal = window.ZarinpalGateway;
    });
    
    test('should request payment successfully', async () => {
        const result = await zarinpal.requestPayment({
            amount: 100000,
            description: 'Test payment',
            callbackUrl: 'http://localhost/callback'
        });
        
        expect(result.success).toBe(true);
        expect(result.authority).toBeDefined();
        expect(result.paymentUrl).toBeDefined();
    });
    
    test('should verify payment successfully', async () => {
        const authority = 'TEST_AUTHORITY_123';
        const result = await zarinpal.verifyPayment(authority, 100000);
        
        expect(result).toBeDefined();
    });
    
    test('should toggle sandbox mode', () => {
        zarinpal.setSandbox(true);
        expect(zarinpal.config.sandbox).toBe(true);
        
        zarinpal.setSandbox(false);
        expect(zarinpal.config.sandbox).toBe(false);
    });
});

describe('Payment Module - Wallet', () => {
    let wallet;
    
    beforeEach(() => {
        wallet = window.WalletSystem;
        localStorage.clear();
    });
    
    test('should create new wallet for user', () => {
        const userId = 1;
        wallet.createNewWallet();
        
        expect(wallet.currentWallet).toBeDefined();
        expect(wallet.currentWallet.balance).toBe(0);
    });
    
    test('should charge wallet successfully', async () => {
        wallet.createNewWallet();
        const initialBalance = wallet.getBalance();
        
        await wallet.chargeWallet({ amount: 100000 });
        
        expect(wallet.getBalance()).toBe(initialBalance + 100000);
    });
    
    test('should withdraw from wallet successfully', () => {
        wallet.createNewWallet();
        wallet.currentWallet.balance = 100000;
        
        const result = wallet.withdrawFromWallet({ amount: 50000 });
        
        expect(result).toBe(true);
        expect(wallet.getBalance()).toBe(50000);
    });
    
    test('should not withdraw more than balance', () => {
        wallet.createNewWallet();
        wallet.currentWallet.balance = 100000;
        
        const result = wallet.withdrawFromWallet({ amount: 200000 });
        
        expect(result).toBe(false);
        expect(wallet.getBalance()).toBe(100000);
    });
    
    test('should add transaction to history', () => {
        wallet.createNewWallet();
        const initialCount = wallet.transactions.length;
        
        wallet.currentWallet.balance = 100000;
        wallet.saveWallet();
        
        expect(wallet.transactions.length).toBe(initialCount);
    });
});
