import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('CouponService', () => {
  let service: CouponService;
  let prisma: {
    coupon: Record<string, jest.Mock>;
    couponUsage: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      coupon: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      couponUsage: { findUnique: jest.fn(), create: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [CouponService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CouponService);
  });

  describe('create (via createGlobal)', () => {
    it('کد تکراری رو رد می‌کنه', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ id: 'c1' });

      await expect(
        service.createGlobal({
          code: 'SUMMER10',
          type: 'PERCENTAGE',
          value: 10,
          validFrom: '2026-01-01',
          validTo: '2026-02-01',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('تاریخ شروع بعد از پایان رو رد می‌کنه', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.createGlobal({
          code: 'BAD',
          type: 'PERCENTAGE',
          value: 10,
          validFrom: '2026-03-01',
          validTo: '2026-01-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('validate', () => {
    const activeCoupon = {
      id: 'c1',
      code: 'SUMMER10',
      isActive: true,
      type: 'PERCENTAGE',
      value: 10,
      minPurchase: null,
      usageLimit: null,
      usageCount: 0,
      businessId: null,
      validFrom: new Date(Date.now() - 100000),
      validTo: new Date(Date.now() + 1000000),
    };

    it('کد نامعتبر یا غیرفعال رو رد می‌کنه', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.validate('MISSING', 'user1', undefined, 100000)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('کد منقضی‌شده رو رد می‌کنه', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...activeCoupon,
        validTo: new Date(Date.now() - 1000),
      });

      await expect(service.validate('SUMMER10', 'user1', undefined, 100000)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('کد مخصوص یک کسب‌وکار دیگه رو رد می‌کنه', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ ...activeCoupon, businessId: 'biz1' });

      await expect(
        service.validate('SUMMER10', 'user1', 'biz2', 100000),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('زیر حداقل مبلغ خرید رو رد می‌کنه', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ ...activeCoupon, minPurchase: 200000 });

      await expect(service.validate('SUMMER10', 'user1', undefined, 100000)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('سقف استفاده‌ی تمام‌شده رو رد می‌کنه', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ ...activeCoupon, usageLimit: 10, usageCount: 10 });

      await expect(service.validate('SUMMER10', 'user1', undefined, 100000)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('کاربری که قبلاً استفاده کرده رو رد می‌کنه', async () => {
      prisma.coupon.findUnique.mockResolvedValue(activeCoupon);
      prisma.couponUsage.findUnique.mockResolvedValue({ id: 'usage1' });

      await expect(service.validate('SUMMER10', 'user1', undefined, 100000)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('تخفیف درصدی رو درست محاسبه می‌کنه', async () => {
      prisma.coupon.findUnique.mockResolvedValue(activeCoupon);
      prisma.couponUsage.findUnique.mockResolvedValue(null);

      const result = await service.validate('SUMMER10', 'user1', undefined, 100000);

      expect(result.discountAmount).toBe(10000); // ۱۰٪ از ۱۰۰٬۰۰۰
    });

    it('تخفیف ثابت رو از کل مبلغ خرید بیشتر نمی‌کنه (cap)', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ ...activeCoupon, type: 'FIXED_AMOUNT', value: 500000 });
      prisma.couponUsage.findUnique.mockResolvedValue(null);

      const result = await service.validate('SUMMER10', 'user1', undefined, 100000);

      expect(result.discountAmount).toBe(100000); // نه بیشتر از مبلغ خرید
    });
  });

  describe('checkAndRedeem', () => {
    it('علاوه بر محاسبه، CouponUsage می‌سازه و usageCount رو افزایش می‌ده', async () => {
      const activeCoupon = {
        id: 'c1',
        isActive: true,
        type: 'PERCENTAGE',
        value: 10,
        minPurchase: null,
        usageLimit: null,
        usageCount: 0,
        businessId: null,
        validFrom: new Date(Date.now() - 100000),
        validTo: new Date(Date.now() + 1000000),
      };
      const tx = {
        coupon: { findUnique: jest.fn().mockResolvedValue(activeCoupon), update: jest.fn() },
        couponUsage: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
      };

      const result = await service.checkAndRedeem(
        tx as never,
        'SUMMER10',
        'user1',
        undefined,
        100000,
        'booking1',
      );

      expect(tx.couponUsage.create).toHaveBeenCalledWith({
        data: { couponId: 'c1', userId: 'user1', bookingId: 'booking1', discountAmount: 10000 },
      });
      expect(tx.coupon.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { usageCount: { increment: 1 } },
      });
      expect(result.discountAmount).toBe(10000);
    });
  });
});
