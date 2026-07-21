 /* ============================================
   DISCOUNT.TEST.JS - تست‌های واحد ماژول تخفیف
   ============================================ */

describe('Discount Module - Discount Engine', () => {
    let discountEngine;
    
    beforeEach(() => {
        discountEngine = window.DiscountEngine;
        localStorage.clear();
    });
    
    test('should calculate discount correctly', () => {
        const result = discountEngine.calculateDiscount({
            amount: 100000,
            userId: 1,
            couponCode: null
        });
        
        expect(result).toBeDefined();
        expect(result.originalAmount).toBe(100000);
        expect(result.finalAmount).toBeLessThanOrEqual(100000);
    });
    
    test('should respect max discount limit of 30%', () => {
        const result = discountEngine.calculateDiscount({
            amount: 100000,
            userId: 1
        });
        
        const discountPercent = (result.discountAmount / result.originalAmount) * 100;
        expect(discountPercent).toBeLessThanOrEqual(30);
    });
    
    test('should apply multiple discounts', () => {
        const result = discountEngine.calculateDiscount({
            amount: 100000,
            userId: 1
        });
        
        expect(result.appliedDiscounts).toBeDefined();
    });
});

describe('Discount Module - Coupon System', () => {
    let couponSystem;
    
    beforeEach(() => {
        couponSystem = window.CouponSystem;
        localStorage.clear();
    });
    
    test('should validate valid coupon', () => {
        couponSystem.coupons = [{
            code: 'TEST10',
            type: 'percentage',
            value: 10,
            minPurchase: 50000,
            validFrom: new Date().toISOString(),
            validTo: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
            usageLimit: 100,
            usageCount: 0,
            enabled: true
        }];
        
        const validation = couponSystem.validateCoupon('TEST10', 100000);
        expect(validation.valid).toBe(true);
    });
    
    test('should reject invalid coupon', () => {
        const validation = couponSystem.validateCoupon('INVALID', 100000);
        expect(validation.valid).toBe(false);
    });
    
    test('should reject expired coupon', () => {
        couponSystem.coupons = [{
            code: 'EXPIRED',
            type: 'percentage',
            value: 10,
            minPurchase: 50000,
            validFrom: new Date(Date.now() - 14*24*60*60*1000).toISOString(),
            validTo: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
            usageLimit: 100,
            usageCount: 0,
            enabled: true
        }];
        
        const validation = couponSystem.validateCoupon('EXPIRED', 100000);
        expect(validation.valid).toBe(false);
    });
    
    test('should reject coupon with insufficient purchase amount', () => {
        couponSystem.coupons = [{
            code: 'MINPURCHASE',
            type: 'percentage',
            value: 10,
            minPurchase: 200000,
            validFrom: new Date().toISOString(),
            validTo: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
            usageLimit: 100,
            usageCount: 0,
            enabled: true
        }];
        
        const validation = couponSystem.validateCoupon('MINPURCHASE', 100000);
        expect(validation.valid).toBe(false);
    });
});

describe('Discount Module - Loyalty Discount', () => {
    let loyaltyDiscount;
    
    beforeEach(() => {
        loyaltyDiscount = window.LoyaltyDiscount;
    });
    
    test('should get correct tier by points', () => {
        const bronzeTier = loyaltyDiscount.getTierByPoints(50);
        expect(bronzeTier).toBe('bronze');
        
        const silverTier = loyaltyDiscount.getTierByPoints(150);
        expect(silverTier).toBe('silver');
        
        const goldTier = loyaltyDiscount.getTierByPoints(350);
        expect(goldTier).toBe('gold');
    });
    
    test('should calculate loyalty discount correctly', () => {
        const user = { loyaltyTier: 'gold' };
        const result = loyaltyDiscount.calculateLoyaltyDiscount(user, 100000);
        
        expect(result.percent).toBe(15);
        expect(result.amount).toBe(15000);
    });
    
    test('should add points for action', () => {
        const points = loyaltyDiscount.addPoints('09121234567', 'registration');
        expect(points).toBe(100);
    });
});
