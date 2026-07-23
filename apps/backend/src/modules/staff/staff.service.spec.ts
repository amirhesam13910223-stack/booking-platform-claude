import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('StaffService', () => {
  let service: StaffService;
  let prisma: {
    user: Record<string, jest.Mock>;
    staffMember: Record<string, jest.Mock>;
    branch: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      staffMember: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      branch: { findUnique: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [StaffService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(StaffService);
  });

  describe('invite', () => {
    it('اگر شماره ثبت‌نام نکرده باشه خطا می‌ده', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.invite('biz1', { phone: '09120000000', role: 'STAFF' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('اگر کاربر از قبل عضو همون کسب‌وکار باشه، خطای تکراری می‌ده', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.staffMember.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.invite('biz1', { phone: '09120000000', role: 'STAFF' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('اگر branchId داده شده متعلق به کسب‌وکار دیگه‌ای باشه خطا می‌ده', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.staffMember.findUnique.mockResolvedValue(null);
      prisma.branch.findUnique.mockResolvedValue({ id: 'branch1', businessId: 'other-biz' });

      await expect(
        service.invite('biz1', { phone: '09120000000', role: 'STAFF', branchId: 'branch1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('در حالت معتبر StaffMember جدید می‌سازه', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.staffMember.findUnique.mockResolvedValue(null);
      prisma.staffMember.create.mockResolvedValue({ id: 'sm1', role: 'STAFF' });

      const result = await service.invite('biz1', {
        phone: '09120000000',
        role: 'STAFF',
        specialty: 'آرایش مو',
      });

      expect(prisma.staffMember.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          businessId: 'biz1',
          role: 'STAFF',
          specialty: 'آرایش مو',
          branchId: undefined,
        },
      });
      expect(result).toEqual({ id: 'sm1', role: 'STAFF' });
    });
  });

  describe('deactivate', () => {
    it('نمی‌ذاره مالک کسب‌وکار (OWNER) غیرفعال بشه', async () => {
      prisma.staffMember.findUnique.mockResolvedValue({
        id: 'sm1',
        businessId: 'biz1',
        role: 'OWNER',
      });

      await expect(service.deactivate('biz1', 'sm1')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.staffMember.update).not.toHaveBeenCalled();
    });

    it('کارمند عادی رو با موفقیت غیرفعال می‌کنه', async () => {
      prisma.staffMember.findUnique.mockResolvedValue({
        id: 'sm1',
        businessId: 'biz1',
        role: 'STAFF',
      });
      prisma.staffMember.update.mockResolvedValue({ id: 'sm1', isActive: false });

      await service.deactivate('biz1', 'sm1');

      expect(prisma.staffMember.update).toHaveBeenCalledWith({
        where: { id: 'sm1' },
        data: { isActive: false },
      });
    });

    it('کارمند متعلق به کسب‌وکار دیگه رو رد می‌کنه', async () => {
      prisma.staffMember.findUnique.mockResolvedValue({
        id: 'sm1',
        businessId: 'other-biz',
        role: 'STAFF',
      });

      await expect(service.deactivate('biz1', 'sm1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
