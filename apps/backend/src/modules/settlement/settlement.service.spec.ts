import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('SettlementService', () => {
  let service: SettlementService;
  let prisma: {
    business: Record<string, jest.Mock>;
    payment: Record<string, jest.Mock>;
    settlement: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      business: { findUnique: jest.fn(), findMany: jest.fn() },
      payment: { findMany: jest.fn() },
      settlement: { create: jest.fn(), findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [SettlementService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(SettlementService);
  });

  it('کسب‌وکار ناموجود رو رد می‌کنه', async () => {
    prisma.business.findUnique.mockResolvedValue(null);

    await expect(
      service.runForBusiness('missing', new Date('2026-01-01'), new Date('2026-01-31')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('کمیسیون رو درست از مجموع تراکنش‌های موفق محاسبه می‌کنه', async () => {
    prisma.business.findUnique.mockResolvedValue({ id: 'biz1', commissionPercent: 10 });
    prisma.payment.findMany.mockResolvedValue([
      { amount: 100000 },
      { amount: 200000 },
    ]);
    prisma.settlement.create.mockImplementation(({ data }: { data: unknown }) => data);

    const result = await service.runForBusiness('biz1', new Date('2026-01-01'), new Date('2026-01-31'));

    // مجموع ۳۰۰٬۰۰۰، کمیسیون ۱۰٪ = ۳۰٬۰۰۰، خالص = ۲۷۰٬۰۰۰
    expect(result).toEqual(
      expect.objectContaining({
        grossAmount: 300000,
        commissionAmount: 30000,
        netAmount: 270000,
      }),
    );
  });

  it('بدون businessId، برای همه‌ی کسب‌وکارهای تایید‌شده اجرا می‌شه', async () => {
    prisma.business.findMany.mockResolvedValue([{ id: 'biz1' }, { id: 'biz2' }]);
    prisma.business.findUnique
      .mockResolvedValueOnce({ id: 'biz1', commissionPercent: 10 })
      .mockResolvedValueOnce({ id: 'biz2', commissionPercent: 15 });
    prisma.payment.findMany.mockResolvedValue([]);
    prisma.settlement.create.mockImplementation(({ data }: { data: unknown }) => data);

    const results = await service.runBatch({ periodStart: '2026-01-01', periodEnd: '2026-01-31' });

    expect(results).toHaveLength(2);
    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'APPROVED' } }),
    );
  });
});
