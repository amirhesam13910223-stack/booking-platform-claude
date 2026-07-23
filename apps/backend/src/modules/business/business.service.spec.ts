import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BusinessService } from './business.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

describe('BusinessService', () => {
  let service: BusinessService;
  let prisma: {
    business: Record<string, jest.Mock>;
    staffMember: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      business: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
      staffMember: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    audit = { log: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(BusinessService);
  });

  describe('create', () => {
    it('کسب‌وکار و رکورد StaffMember(OWNER) رو در یک تراکنش می‌سازه', async () => {
      const fakeBusiness = { id: 'biz1', name: 'آرایشگاه تست' };
      // شبیه‌سازی رفتار prisma.$transaction: تابع داده‌شده رو با یک
      // "tx" جعلی که همون متدهای اصلی رو داره صدا می‌زنه.
      const tx = {
        business: { create: jest.fn().mockResolvedValue(fakeBusiness) },
        staffMember: { create: jest.fn().mockResolvedValue({ id: 'sm1', role: 'OWNER' }) },
      };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(tx));

      const result = await service.create('user1', { name: 'آرایشگاه تست', category: 'beauty' });

      expect(tx.business.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId: 'user1', name: 'آرایشگاه تست' }),
        }),
      );
      expect(tx.staffMember.create).toHaveBeenCalledWith({
        data: { userId: 'user1', businessId: 'biz1', role: 'OWNER' },
      });
      expect(result).toEqual(fakeBusiness);
    });
  });

  describe('approve / reject / suspend', () => {
    it('approve فقط با کسب‌وکار موجود کار می‌کنه و audit log می‌زنه', async () => {
      prisma.business.findUnique.mockResolvedValue({ id: 'biz1' });
      prisma.business.update.mockResolvedValue({ id: 'biz1', status: 'APPROVED' });

      await service.approve('biz1', 'admin1');

      expect(prisma.business.update).toHaveBeenCalledWith({
        where: { id: 'biz1' },
        data: { status: 'APPROVED', rejectReason: null },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'admin1',
          action: 'BUSINESS_APPROVED',
          entityType: 'Business',
          entityId: 'biz1',
        }),
      );
    });

    it('approve روی کسب‌وکار ناموجود خطا می‌ده', async () => {
      prisma.business.findUnique.mockResolvedValue(null);

      await expect(service.approve('missing', 'admin1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.business.update).not.toHaveBeenCalled();
    });

    it('reject دلیل رد رو در rejectReason و audit metadata ذخیره می‌کنه', async () => {
      prisma.business.findUnique.mockResolvedValue({ id: 'biz1' });
      prisma.business.update.mockResolvedValue({ id: 'biz1', status: 'REJECTED' });

      await service.reject('biz1', 'admin1', 'مدارک ناقص است');

      expect(prisma.business.update).toHaveBeenCalledWith({
        where: { id: 'biz1' },
        data: { status: 'REJECTED', rejectReason: 'مدارک ناقص است' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { reason: 'مدارک ناقص است' } }),
      );
    });

    it('suspend وضعیت رو SUSPENDED می‌کنه و audit log می‌زنه', async () => {
      prisma.business.findUnique.mockResolvedValue({ id: 'biz1' });
      prisma.business.update.mockResolvedValue({ id: 'biz1', status: 'SUSPENDED' });

      await service.suspend('biz1', 'admin1', 'تخلف گزارش‌شده');

      expect(prisma.business.update).toHaveBeenCalledWith({
        where: { id: 'biz1' },
        data: { status: 'SUSPENDED', rejectReason: 'تخلف گزارش‌شده' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BUSINESS_SUSPENDED' }),
      );
    });
  });
});
