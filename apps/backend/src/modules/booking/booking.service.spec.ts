import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisLockService } from '../../common/redis/redis-lock.service';
import { AvailabilityService } from './availability.service';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: {
    business: Record<string, jest.Mock>;
    branch: Record<string, jest.Mock>;
    service: Record<string, jest.Mock>;
    staffMember: Record<string, jest.Mock>;
    booking: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let lock: { withLock: jest.Mock; acquire: jest.Mock; release: jest.Mock };
  let availability: { getFreeSlots: jest.Mock };

  beforeEach(async () => {
    prisma = {
      business: { findFirst: jest.fn() },
      branch: { findFirst: jest.fn() },
      service: { findFirst: jest.fn(), findUniqueOrThrow: jest.fn(), findUnique: jest.fn() },
      staffMember: { findFirst: jest.fn() },
      booking: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    lock = {
      withLock: jest.fn((key: string, fn: () => unknown) => fn()),
      acquire: jest.fn(),
      release: jest.fn(),
    };
    availability = { getFreeSlots: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisLockService, useValue: lock },
        { provide: AvailabilityService, useValue: availability },
      ],
    }).compile();

    service = moduleRef.get(BookingService);
  });

  describe('hold', () => {
    const validDto = {
      businessId: 'biz1',
      branchId: 'branch1',
      serviceId: 'svc1',
      staffMemberId: 'staff1',
      startTime: '2099-08-01T09:00:00.000Z',
    };

    it('روی کسب‌وکار تایید‌نشده خطا می‌ده', async () => {
      prisma.business.findFirst.mockResolvedValue(null);

      await expect(service.hold('user1', validDto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('اگر قفل Redis گرفته نشه، خطای ۴۰۹ (تداخل) میده نه خطای خام', async () => {
      prisma.business.findFirst.mockResolvedValue({ id: 'biz1', cancellationPolicy: {} });
      prisma.branch.findFirst.mockResolvedValue({ id: 'branch1' });
      prisma.service.findFirst.mockResolvedValue({
        id: 'svc1',
        durationMinutes: 30,
        price: 100000,
        requiresDeposit: false,
      });
      prisma.staffMember.findFirst.mockResolvedValue({ id: 'staff1', isActive: true });
      lock.withLock.mockRejectedValue(new Error('LOCK_BUSY:booking-lock:x'));

      await expect(service.hold('user1', validDto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('در حالت معتبر یک Booking با وضعیت HOLD می‌سازه', async () => {
      prisma.business.findFirst.mockResolvedValue({
        id: 'biz1',
        cancellationPolicy: { freeCancelHours: 24, feePercent: 20 },
      });
      prisma.branch.findFirst.mockResolvedValue({ id: 'branch1' });
      prisma.service.findFirst.mockResolvedValue({
        id: 'svc1',
        durationMinutes: 30,
        price: 100000,
        requiresDeposit: true,
        depositPercent: 50,
      });
      prisma.staffMember.findFirst.mockResolvedValue({ id: 'staff1', isActive: true });

      const tx = {
        booking: {
          findFirst: jest.fn().mockResolvedValue(null), // اسلات آزاده
          create: jest.fn().mockResolvedValue({ id: 'booking1', status: 'HOLD' }),
        },
      };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(tx));

      const result = await service.hold('user1', validDto);

      expect(tx.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user1',
            status: 'HOLD',
            depositRequired: 50000, // ۵۰٪ از ۱۰۰٬۰۰۰
          }),
        }),
      );
      expect(result).toEqual({ id: 'booking1', status: 'HOLD' });
    });

    it('اگر همون بازه از قبل رزرو فعال داشته باشه، تداخل رو تشخیص میده', async () => {
      prisma.business.findFirst.mockResolvedValue({ id: 'biz1', cancellationPolicy: {} });
      prisma.branch.findFirst.mockResolvedValue({ id: 'branch1' });
      prisma.service.findFirst.mockResolvedValue({
        id: 'svc1',
        durationMinutes: 30,
        price: 100000,
        requiresDeposit: false,
      });
      prisma.staffMember.findFirst.mockResolvedValue({ id: 'staff1', isActive: true });

      const tx = {
        booking: {
          findFirst: jest.fn().mockResolvedValue({ id: 'existing-booking' }), // تداخل داره
          create: jest.fn(),
        },
      };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(tx));

      await expect(service.hold('user1', validDto)).rejects.toBeInstanceOf(ConflictException);
      expect(tx.booking.create).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('رزروی که مال کاربر دیگه‌ست رو پیدا نمی‌کنه', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);

      await expect(service.confirm('booking1', 'user1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('رزرو غیر-HOLD رو تایید نمی‌کنه', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'booking1', status: 'CONFIRMED' });

      await expect(service.confirm('booking1', 'user1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('HOLD منقضی‌شده رو خودکار لغو و خطا میده', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking1',
        status: 'HOLD',
        holdExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.confirm('booking1', 'user1')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED' }) }),
      );
    });

    it('خدمتی که نیاز به بیعانه داره رو به PENDING (نه CONFIRMED مستقیم) می‌بره', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking1',
        status: 'HOLD',
        serviceId: 'svc1',
        holdExpiresAt: new Date(Date.now() + 100000),
      });
      prisma.service.findUnique.mockResolvedValue({ requiresDeposit: true });
      prisma.booking.update.mockResolvedValue({ id: 'booking1', status: 'PENDING' });

      const result = await service.confirm('booking1', 'user1');

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking1' },
        data: { status: 'PENDING', holdExpiresAt: null },
      });
      expect(result.status).toBe('PENDING');
    });

    it('خدمت بدون بیعانه مستقیم CONFIRMED می‌شه', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking1',
        status: 'HOLD',
        serviceId: 'svc1',
        holdExpiresAt: new Date(Date.now() + 100000),
      });
      prisma.service.findUnique.mockResolvedValue({ requiresDeposit: false });
      prisma.booking.update.mockResolvedValue({ id: 'booking1', status: 'CONFIRMED' });

      const result = await service.confirm('booking1', 'user1');

      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('cancelByUser — محاسبه‌ی جریمه‌ی لغو', () => {
    it('لغو خارج از بازه‌ی آزاد، جریمه محاسبه می‌کنه', async () => {
      const soonBooking = {
        id: 'booking1',
        status: 'CONFIRMED',
        startTime: new Date(Date.now() + 3 * 3600000), // فقط ۳ ساعت مونده
        cancellationPolicySnapshot: { freeCancelHours: 24, feePercent: 20 },
      };
      prisma.booking.findFirst.mockResolvedValue(soonBooking);
      prisma.booking.update.mockResolvedValue({ ...soonBooking, status: 'CANCELLED' });

      const result = await service.cancelByUser('booking1', 'user1', {});

      expect(result.feeApplied).toBe(true);
      expect(result.feePercent).toBe(20);
    });

    it('لغو داخل بازه‌ی آزاد، جریمه نداره', async () => {
      const farBooking = {
        id: 'booking1',
        status: 'CONFIRMED',
        startTime: new Date(Date.now() + 48 * 3600000), // ۴۸ ساعت مونده
        cancellationPolicySnapshot: { freeCancelHours: 24, feePercent: 20 },
      };
      prisma.booking.findFirst.mockResolvedValue(farBooking);
      prisma.booking.update.mockResolvedValue({ ...farBooking, status: 'CANCELLED' });

      const result = await service.cancelByUser('booking1', 'user1', {});

      expect(result.feeApplied).toBe(false);
      expect(result.feePercent).toBe(0);
    });

    it('رزرو COMPLETED دیگه قابل لغو نیست', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking1',
        status: 'COMPLETED',
        startTime: new Date(),
        cancellationPolicySnapshot: {},
      });

      await expect(service.cancelByUser('booking1', 'user1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('updateStatus — انتقال وضعیت سمت کسب‌وکار', () => {
    it('انتقال نامعتبر (COMPLETED به PENDING) رو رد می‌کنه', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'b1', businessId: 'biz1', status: 'COMPLETED' });

      await expect(
        service.updateStatus('biz1', 'b1', { status: 'CONFIRMED' as never }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('انتقال معتبر (CONFIRMED به COMPLETED) رو انجام میده', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'b1', businessId: 'biz1', status: 'CONFIRMED' });
      prisma.booking.update.mockResolvedValue({ id: 'b1', status: 'COMPLETED' });

      const result = await service.updateStatus('biz1', 'b1', { status: 'COMPLETED' as never });

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('releaseExpiredHolds', () => {
    it('همه‌ی HOLDهای منقضی رو CANCELLED می‌کنه و تعدادشون رو برمی‌گردونه', async () => {
      prisma.booking.updateMany.mockResolvedValue({ count: 3 });

      const count = await service.releaseExpiredHolds();

      expect(count).toBe(3);
      expect(prisma.booking.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'HOLD' }),
          data: expect.objectContaining({ status: 'CANCELLED' }),
        }),
      );
    });
  });
});
