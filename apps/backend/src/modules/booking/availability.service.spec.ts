import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let prisma: {
    service: Record<string, jest.Mock>;
    branch: Record<string, jest.Mock>;
    staffMember: Record<string, jest.Mock>;
    serviceStaff: Record<string, jest.Mock>;
    workingHours: Record<string, jest.Mock>;
    holiday: Record<string, jest.Mock>;
    booking: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      service: { findFirst: jest.fn() },
      branch: { findFirst: jest.fn() },
      staffMember: { findFirst: jest.fn() },
      serviceStaff: { findMany: jest.fn() },
      workingHours: { findFirst: jest.fn() },
      holiday: { findFirst: jest.fn() },
      booking: { findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AvailabilityService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AvailabilityService);
  });

  it('اگر خدمت یافت نشد یا غیرفعال بود خطا می‌ده', async () => {
    prisma.service.findFirst.mockResolvedValue(null);

    await expect(
      service.getFreeSlots('biz1', { serviceId: 'missing', branchId: 'b1', date: '2026-08-01' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('برای کارمند مشخص، بازه‌های ۳۰ دقیقه‌ای درون ساعت کاری تولید می‌کنه', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 's1', durationMinutes: 30 });
    prisma.branch.findFirst.mockResolvedValue({ id: 'b1' });
    prisma.staffMember.findFirst.mockResolvedValue({ id: 'staff1', isActive: true });
    prisma.workingHours.findFirst
      .mockResolvedValueOnce({ startTime: '09:00', endTime: '10:00' }) // staffHasAnyHours check
      .mockResolvedValueOnce({ startTime: '09:00', endTime: '10:00' }); // day-specific
    prisma.holiday.findFirst.mockResolvedValue(null);
    prisma.booking.findMany.mockResolvedValue([]);

    // یک تاریخ در آینده‌ی دور تا فیلتر "گذشته" مزاحم تست نشه
    const result = await service.getFreeSlots('biz1', {
      serviceId: 's1',
      staffMemberId: 'staff1',
      branchId: 'b1',
      date: '2099-08-01',
    });

    // بین ۹ تا ۱۰ با گام ۳۰ دقیقه = دو اسلات: 09:00 و 09:30
    expect(result).toHaveLength(2);
    expect(result[0].availableStaffIds).toEqual(['staff1']);
  });

  it('اسلاتی که با یک رزرو فعال تداخل داره رو حذف می‌کنه', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 's1', durationMinutes: 30 });
    prisma.branch.findFirst.mockResolvedValue({ id: 'b1' });
    prisma.staffMember.findFirst.mockResolvedValue({ id: 'staff1', isActive: true });
    prisma.workingHours.findFirst
      .mockResolvedValueOnce({ startTime: '09:00', endTime: '10:00' })
      .mockResolvedValueOnce({ startTime: '09:00', endTime: '10:00' });
    prisma.holiday.findFirst.mockResolvedValue(null);

    const bookedStart = new Date('2099-08-01T09:00:00.000Z');
    const bookedEnd = new Date('2099-08-01T09:30:00.000Z');
    prisma.booking.findMany.mockResolvedValue([{ startTime: bookedStart, endTime: bookedEnd }]);

    const result = await service.getFreeSlots('biz1', {
      serviceId: 's1',
      staffMemberId: 'staff1',
      branchId: 'b1',
      date: '2099-08-01',
    });

    // فقط 09:30 باید باقی بمونه، چون 09:00 با رزرو موجود تداخل داره
    expect(result).toHaveLength(1);
    expect(result[0].startTime).toBe('2099-08-01T09:30:00.000Z');
  });

  it('روزی که ساعت کاری تعریف نشده، هیچ اسلاتی برنمی‌گردونه', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 's1', durationMinutes: 30 });
    prisma.branch.findFirst.mockResolvedValue({ id: 'b1' });
    prisma.staffMember.findFirst.mockResolvedValue({ id: 'staff1', isActive: true });
    prisma.workingHours.findFirst
      .mockResolvedValueOnce({ startTime: '09:00', endTime: '10:00' }) // staff has SOME hours
      .mockResolvedValueOnce(null); // ولی نه برای این روز خاص

    const result = await service.getFreeSlots('biz1', {
      serviceId: 's1',
      staffMemberId: 'staff1',
      branchId: 'b1',
      date: '2099-08-01',
    });

    expect(result).toHaveLength(0);
  });

  it('روز تعطیل هیچ اسلاتی برنمی‌گردونه', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 's1', durationMinutes: 30 });
    prisma.branch.findFirst.mockResolvedValue({ id: 'b1' });
    prisma.staffMember.findFirst.mockResolvedValue({ id: 'staff1', isActive: true });
    prisma.workingHours.findFirst
      .mockResolvedValueOnce({ startTime: '09:00', endTime: '10:00' })
      .mockResolvedValueOnce({ startTime: '09:00', endTime: '10:00' });
    prisma.holiday.findFirst.mockResolvedValueOnce({ id: 'h1' }); // تعطیلی کارمند

    const result = await service.getFreeSlots('biz1', {
      serviceId: 's1',
      staffMemberId: 'staff1',
      branchId: 'b1',
      date: '2099-08-01',
    });

    expect(result).toHaveLength(0);
  });

  it('بدون staffMemberId، از کارمندهای اختصاص‌یافته به خدمت استفاده می‌کنه', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 's1', durationMinutes: 60 });
    prisma.branch.findFirst.mockResolvedValue({ id: 'b1' });
    prisma.serviceStaff.findMany.mockResolvedValue([{ staffMemberId: 'staff1' }, { staffMemberId: 'staff2' }]);
    prisma.workingHours.findFirst.mockResolvedValue(null); // هیچ‌کدوم ساعت شخصی ندارن → fallback به شعبه
    // fallback به branch-level hours برای هر دو کارمند
    prisma.workingHours.findFirst
      .mockResolvedValueOnce(null) // staff1: هیچ ساعت شخصی
      .mockResolvedValueOnce({ startTime: '09:00', endTime: '10:00' }) // branch fallback برای staff1
      .mockResolvedValueOnce(null) // staff2: هیچ ساعت شخصی
      .mockResolvedValueOnce({ startTime: '09:00', endTime: '10:00' }); // branch fallback برای staff2
    prisma.holiday.findFirst.mockResolvedValue(null);
    prisma.booking.findMany.mockResolvedValue([]);

    const result = await service.getFreeSlots('biz1', {
      serviceId: 's1',
      branchId: 'b1',
      date: '2099-08-01',
    });

    expect(result).toHaveLength(1); // یک اسلات ۶۰ دقیقه‌ای (۹ تا ۱۰)
    expect(result[0].availableStaffIds.sort()).toEqual(['staff1', 'staff2']);
  });
});
