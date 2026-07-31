import { Test } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let prisma: { loyaltyAccount: Record<string, jest.Mock>; loyaltyTransaction: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      loyaltyAccount: { upsert: jest.fn(), update: jest.fn() },
      loyaltyTransaction: { create: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [LoyaltyService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(LoyaltyService);
  });

  describe('earnFromPurchase', () => {
    it('هر ۱۰٬۰۰۰ تومان یک امتیاز می‌ده، باقیمانده رو نادیده می‌گیره', async () => {
      const tx = {
        loyaltyAccount: { upsert: jest.fn().mockResolvedValue({ id: 'a1', points: 0 }), update: jest.fn() },
        loyaltyTransaction: { create: jest.fn() },
      };

      await service.earnFromPurchase(tx as never, 'user1', 95000, 'خرید رزرو');

      // ۹۵٬۰۰۰ / ۱۰٬۰۰۰ = ۹.۵ → floor = ۹ امتیاز
      expect(tx.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: { accountId: 'a1', points: 9, reason: 'خرید رزرو', referenceId: undefined },
      });
    });

    it('برای مبلغ زیر ۱۰٬۰۰۰ تومان هیچ امتیازی نمی‌ده', async () => {
      const tx = {
        loyaltyAccount: { upsert: jest.fn().mockResolvedValue({ id: 'a1', points: 0 }) },
        loyaltyTransaction: { create: jest.fn() },
      };

      await service.earnFromPurchase(tx as never, 'user1', 5000, 'خرید کوچک');

      expect(tx.loyaltyTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe('addPoints — ارتقای سطح', () => {
    it('با عبور از آستانه‌ی ۱۰۰۰ امتیاز، سطح به SILVER ارتقا پیدا می‌کنه', async () => {
      const tx = {
        loyaltyAccount: {
          upsert: jest.fn().mockResolvedValue({ id: 'a1', points: 950 }),
          update: jest.fn(),
        },
        loyaltyTransaction: { create: jest.fn() },
      };

      await service.addPoints(tx as never, 'user1', 100, 'تست');

      expect(tx.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        data: { points: 1050, tier: 'SILVER' },
      });
    });

    it('زیر همه‌ی آستانه‌ها روی BRONZE می‌مونه', async () => {
      const tx = {
        loyaltyAccount: {
          upsert: jest.fn().mockResolvedValue({ id: 'a1', points: 0 }),
          update: jest.fn(),
        },
        loyaltyTransaction: { create: jest.fn() },
      };

      await service.addPoints(tx as never, 'user1', 50, 'تست');

      expect(tx.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        data: { points: 50, tier: 'BRONZE' },
      });
    });
  });
});
