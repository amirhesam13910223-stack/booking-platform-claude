import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkingHoursService } from './working-hours.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('WorkingHoursService', () => {
  let service: WorkingHoursService;
  let prisma: {
    branch: Record<string, jest.Mock>;
    staffMember: Record<string, jest.Mock>;
    $transaction: jest.Mock;
    holiday: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      branch: { findUnique: jest.fn() },
      staffMember: { findUnique: jest.fn() },
      $transaction: jest.fn(),
      holiday: { create: jest.fn(), findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [WorkingHoursService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(WorkingHoursService);
  });

  describe('setWorkingHours', () => {
    it('اگر هم branchId و هم staffMemberId داده بشه خطا می‌ده', async () => {
      await expect(
        service.setWorkingHours('biz1', {
          branchId: 'b1',
          staffMemberId: 's1',
          hours: [{ dayOfWeek: 0, startTime: '09:00', endTime: '18:00' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('اگر هیچ‌کدوم داده نشه خطا می‌ده', async () => {
      await expect(
        service.setWorkingHours('biz1', {
          hours: [{ dayOfWeek: 0, startTime: '09:00', endTime: '18:00' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('شعبه‌ای که متعلق به این کسب‌وکار نیست رو رد می‌کنه', async () => {
      prisma.branch.findUnique.mockResolvedValue({ id: 'b1', businessId: 'other-biz' });

      await expect(
        service.setWorkingHours('biz1', {
          branchId: 'b1',
          hours: [{ dayOfWeek: 0, startTime: '09:00', endTime: '18:00' }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('اگر ساعت پایان قبل یا مساوی ساعت شروع باشه خطا می‌ده', async () => {
      prisma.branch.findUnique.mockResolvedValue({ id: 'b1', businessId: 'biz1' });

      await expect(
        service.setWorkingHours('biz1', {
          branchId: 'b1',
          hours: [{ dayOfWeek: 0, startTime: '18:00', endTime: '09:00' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('در حالت معتبر، ساعات قبلی رو پاک و لیست جدید رو جایگزین می‌کنه', async () => {
      prisma.branch.findUnique.mockResolvedValue({ id: 'b1', businessId: 'biz1' });
      const tx = {
        workingHours: {
          deleteMany: jest.fn().mockResolvedValue({}),
          createMany: jest.fn().mockResolvedValue({}),
          findMany: jest.fn().mockResolvedValue([{ dayOfWeek: 0, startTime: '09:00', endTime: '18:00' }]),
        },
      };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(tx));

      await service.setWorkingHours('biz1', {
        branchId: 'b1',
        hours: [{ dayOfWeek: 0, startTime: '09:00', endTime: '18:00' }],
      });

      expect(tx.workingHours.deleteMany).toHaveBeenCalledWith({ where: { branchId: 'b1' } });
      expect(tx.workingHours.createMany).toHaveBeenCalled();
    });
  });

  describe('addHoliday', () => {
    it('کارمندی که متعلق به این کسب‌وکار نیست رو رد می‌کنه', async () => {
      prisma.staffMember.findUnique.mockResolvedValue({ id: 's1', businessId: 'other-biz' });

      await expect(
        service.addHoliday('biz1', { staffMemberId: 's1', date: '2026-08-01' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('در حالت معتبر تعطیلی رو ثبت می‌کنه', async () => {
      prisma.branch.findUnique.mockResolvedValue({ id: 'b1', businessId: 'biz1' });
      prisma.holiday.create.mockResolvedValue({ id: 'h1' });

      await service.addHoliday('biz1', { branchId: 'b1', date: '2026-08-01', reason: 'تعطیل رسمی' });

      expect(prisma.holiday.create).toHaveBeenCalledWith({
        data: { branchId: 'b1', staffMemberId: undefined, date: new Date('2026-08-01'), reason: 'تعطیل رسمی' },
      });
    });
  });
});
