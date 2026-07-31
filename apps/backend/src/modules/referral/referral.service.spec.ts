import { Test } from '@nestjs/testing';
import { ReferralService } from './referral.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

describe('ReferralService', () => {
  let service: ReferralService;
  let prisma: { user: Record<string, jest.Mock>; referral: Record<string, jest.Mock> };
  let loyalty: { addPoints: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      referral: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    loyalty = { addPoints: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: PrismaService, useValue: prisma },
        { provide: LoyaltyService, useValue: loyalty },
      ],
    }).compile();

    service = moduleRef.get(ReferralService);
  });

  describe('registerReferral', () => {
    it('کسی نمی‌تونه خودش رو معرفی کنه', async () => {
      await service.registerReferral('user1', 'user1');

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.referral.create).not.toHaveBeenCalled();
    });

    it('کد ارجاع نامعتبر رو بی‌سروصدا نادیده می‌گیره (جلوی ثبت‌نام رو نمی‌گیره)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.registerReferral('missing-user', 'user2')).resolves.not.toThrow();
      expect(prisma.referral.create).not.toHaveBeenCalled();
    });

    it('اگه کاربر قبلاً معرفی‌شده باشه، دوباره ثبت نمی‌کنه', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'referrer1' });
      prisma.referral.findUnique.mockResolvedValue({ id: 'existing-referral' });

      await service.registerReferral('referrer1', 'user2');

      expect(prisma.referral.create).not.toHaveBeenCalled();
    });

    it('در حالت معتبر یک رکورد Referral با وضعیت PENDING می‌سازه', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'referrer1' });
      prisma.referral.findUnique.mockResolvedValue(null);

      await service.registerReferral('referrer1', 'user2');

      expect(prisma.referral.create).toHaveBeenCalledWith({
        data: { referrerId: 'referrer1', refereeId: 'user2' },
      });
    });

    it('خطای دیتابیس رو می‌بلعه و پرتاب نمی‌کنه (ارجاع نباید جلوی ثبت‌نام رو بگیره)', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('DB down'));

      await expect(service.registerReferral('referrer1', 'user2')).resolves.not.toThrow();
    });
  });

  describe('rewardIfEligible', () => {
    it('اگه ارجاعی وجود نداشته باشه کاری نمی‌کنه', async () => {
      const tx = { referral: { findUnique: jest.fn().mockResolvedValue(null) } };

      await service.rewardIfEligible(tx as never, 'user2');

      expect(loyalty.addPoints).not.toHaveBeenCalled();
    });

    it('ارجاعی که قبلاً REWARDED شده رو دوباره پاداش نمی‌ده', async () => {
      const tx = {
        referral: {
          findUnique: jest.fn().mockResolvedValue({ id: 'r1', status: 'REWARDED' }),
        },
      };

      await service.rewardIfEligible(tx as never, 'user2');

      expect(loyalty.addPoints).not.toHaveBeenCalled();
    });

    it('ارجاع PENDING رو هم به معرف هم به معرفی‌شده پاداش می‌ده و وضعیت رو REWARDED می‌کنه', async () => {
      const tx = {
        referral: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 'r1', status: 'PENDING', referrerId: 'referrer1', refereeId: 'user2' }),
          update: jest.fn(),
        },
      };

      await service.rewardIfEligible(tx as never, 'user2');

      expect(loyalty.addPoints).toHaveBeenCalledTimes(2);
      expect(loyalty.addPoints).toHaveBeenCalledWith(tx, 'referrer1', 100, expect.any(String), 'r1');
      expect(loyalty.addPoints).toHaveBeenCalledWith(tx, 'user2', 100, expect.any(String), 'r1');
      expect(tx.referral.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: 'REWARDED', rewardedAt: expect.any(Date) },
      });
    });
  });
});
