import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisLockService } from '../../common/redis/redis-lock.service';
import { AvailabilityService } from './availability.service';
import { CouponService } from '../coupon/coupon.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { ReferralService } from '../referral/referral.service';
import { HoldBookingDto } from './dto/hold-booking.dto';
import { CreateRecurringBookingDto } from './dto/create-recurring-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { ListBusinessBookingsDto } from './dto/list-business-bookings.dto';

const ACTIVE_STATUSES = ['HOLD', 'PENDING', 'CONFIRMED'] as const;
const HOLD_TTL_MINUTES = 5;

// انتقال وضعیت مجاز — جلوگیری از حرکت‌های نامعتبر مثل COMPLETED→PENDING
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  HOLD: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lock: RedisLockService,
    private readonly availability: AvailabilityService,
    private readonly coupon: CouponService,
    private readonly loyalty: LoyaltyService,
    private readonly referral: ReferralService,
  ) {}

  // ---------------------------------------------------------
  // Hold — قدم اول: قفل موقت روی یک بازه
  // ---------------------------------------------------------

  async hold(userId: string, dto: HoldBookingDto) {
    const { business, service } = await this.loadAndValidateContext(
      dto.businessId,
      dto.branchId,
      dto.serviceId,
      dto.staffMemberId,
    );

    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);
    const lockKey = `booking-lock:${dto.branchId}:${dto.staffMemberId ?? 'branch'}:${startTime.toISOString()}`;

    try {
      return await this.lock.withLock(lockKey, () =>
        this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await this.assertSlotFree(tx, dto.branchId, dto.staffMemberId ?? null, startTime, endTime);

          let discountAmount = 0;
          let redeemedCouponId: string | undefined;
          if (dto.couponCode) {
            const couponResult = await this.coupon.checkAndRedeem(
              tx,
              dto.couponCode,
              userId,
              dto.businessId,
              Number(service.price),
            );
            discountAmount = couponResult.discountAmount;
            redeemedCouponId = couponResult.couponId;
          }
          const priceAfterDiscount = Number(service.price) - discountAmount;

          const depositRequired = service.requiresDeposit
            ? this.round2((priceAfterDiscount * Number(service.depositPercent ?? 0)) / 100)
            : 0;

          const booking = await tx.booking.create({
            data: {
              userId,
              businessId: dto.businessId,
              branchId: dto.branchId,
              staffMemberId: dto.staffMemberId,
              serviceId: dto.serviceId,
              startTime,
              endTime,
              status: 'HOLD',
              priceSnapshot: service.price,
              discountAmount,
              couponCode: dto.couponCode,
              depositRequired,
              cancellationPolicySnapshot: business.cancellationPolicy as Prisma.InputJsonValue,
              holdExpiresAt: new Date(Date.now() + HOLD_TTL_MINUTES * 60000),
            },
          });

          // CouponUsage قبل از ساخته‌شدن booking ثبت شده (چون باید قبل
          // از رزرو مطمئن بشیم قابل استفاده‌ست)؛ حالا bookingId رو
          // بهش وصل می‌کنیم تا برای گزارش‌گیری بعدی قابل ردیابی باشه.
          if (redeemedCouponId) {
            await tx.couponUsage.update({
              where: { couponId_userId: { couponId: redeemedCouponId, userId } },
              data: { bookingId: booking.id },
            });
          }

          return booking;
        }),
      );
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('LOCK_BUSY')) {
        throw new ConflictException('این بازه در حال رزرو توسط کاربر دیگری است، لطفاً دوباره تلاش کنید');
      }
      throw err;
    }
  }

  // ---------------------------------------------------------
  // Confirm
  // ---------------------------------------------------------

  async confirm(bookingId: string, userId: string) {
    const booking = await this.getOwnedBooking(bookingId, userId);
    if (booking.status !== 'HOLD') {
      throw new BadRequestException('این رزرو در وضعیت قابل تایید نیست');
    }
    if (!booking.holdExpiresAt || booking.holdExpiresAt < new Date()) {
      await this.prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelReason: 'انقضای مهلت تایید' } });
      throw new BadRequestException('مهلت تایید این رزرو منقضی شده، لطفاً دوباره رزرو کنید');
    }

    const service = await this.prisma.service.findUnique({ where: { id: booking.serviceId } });
    const nextStatus = service?.requiresDeposit ? 'PENDING' : 'CONFIRMED';

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: nextStatus, holdExpiresAt: null },
      });

      // اگه بیعانه لازم نبود، همین‌جا "خرید قطعی" حساب میشه و باید
      // پاداش‌ها اهدا بشن. اگه بیعانه لازم بود، این کار موقع پرداخت
      // موفق (PaymentService) انجام میشه، نه این‌جا.
      if (nextStatus === 'CONFIRMED') {
        await this.awardPostPurchaseRewards(tx, userId, Number(booking.priceSnapshot) - Number(booking.discountAmount));
      }

      return updated;
    });
  }

  /**
   * بعد از هر "خرید قطعی" (رزرو بدون بیعانه که مستقیم CONFIRMED میشه،
   * یا پرداخت موفق بیعانه) صدا زده میشه — هم امتیاز وفاداری میده هم
   * در صورت وجود ارجاع در انتظار، پاداششو فعال می‌کنه. باید داخل
   * همون تراکنشی که وضعیت رزرو/پرداخت رو نهایی می‌کنه صدا زده بشه.
   */
  async awardPostPurchaseRewards(
    tx: Prisma.TransactionClient,
    userId: string,
    amountToman: number,
  ): Promise<void> {
    await this.loyalty.earnFromPurchase(tx, userId, amountToman, 'خرید رزرو');
    await this.referral.rewardIfEligible(tx, userId);
  }

  async confirmGroup(recurringGroupId: string, userId: string) {
    const bookings = await this.prisma.booking.findMany({ where: { recurringGroupId, userId } });
    if (bookings.length === 0) {
      throw new NotFoundException('رزرو تکرارشونده یافت نشد');
    }
    const results = [];
    for (const b of bookings) {
      results.push(await this.confirm(b.id, userId));
    }
    return results;
  }

  // ---------------------------------------------------------
  // Cancel
  // ---------------------------------------------------------

  async cancelByUser(bookingId: string, userId: string, dto: CancelBookingDto) {
    const booking = await this.getOwnedBooking(bookingId, userId);
    return this.cancelInternal(booking, dto.reason, true);
  }

  async cancelByBusiness(businessId: string, bookingId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findFirst({ where: { id: bookingId, businessId } });
    if (!booking) {
      throw new NotFoundException('رزرو یافت نشد');
    }
    return this.cancelInternal(booking, dto.reason, false);
  }

  private async cancelInternal(
    booking: { id: string; status: string; startTime: Date; cancellationPolicySnapshot: unknown },
    reason: string | undefined,
    cancelledByUser: boolean,
  ) {
    if (!ALLOWED_STATUS_TRANSITIONS[booking.status]?.includes('CANCELLED')) {
      throw new BadRequestException('این رزرو دیگر قابل لغو نیست');
    }

    const hoursUntilStart = (booking.startTime.getTime() - Date.now()) / 3600000;
    const policy = booking.cancellationPolicySnapshot as { freeCancelHours: number; feePercent: number };
    const feeApplies = cancelledByUser && hoursUntilStart < policy.freeCancelHours;

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
    });

    return { booking: updated, feeApplied: feeApplies, feePercent: feeApplies ? policy.feePercent : 0 };
  }

  // ---------------------------------------------------------
  // Reschedule
  // ---------------------------------------------------------

  async reschedule(bookingId: string, userId: string, dto: RescheduleBookingDto) {
    const booking = await this.getOwnedBooking(bookingId, userId);
    if (!['HOLD', 'PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('این رزرو قابل تغییر زمان نیست');
    }

    const service = await this.prisma.service.findUniqueOrThrow({ where: { id: booking.serviceId } });
    const newStart = new Date(dto.newStartTime);
    const newEnd = new Date(newStart.getTime() + service.durationMinutes * 60000);

    // اعتبارسنجی زمان جدید دقیقاً با همون منطق availability که به
    // کاربر نمایش داده شده — تا از هرگونه ناهماهنگی جلوگیری بشه.
    const dateOnly = newStart.toISOString().slice(0, 10);
    const freeSlots = await this.availability.getFreeSlots(booking.businessId, {
      serviceId: booking.serviceId,
      staffMemberId: booking.staffMemberId ?? undefined,
      branchId: booking.branchId,
      date: dateOnly,
    });
    const matches = freeSlots.some((s) => s.startTime === newStart.toISOString());
    if (!matches) {
      throw new ConflictException('بازه‌ی زمانی جدید آزاد نیست');
    }

    const lockKey = `booking-lock:${booking.branchId}:${booking.staffMemberId ?? 'branch'}:${newStart.toISOString()}`;
    try {
      return await this.lock.withLock(lockKey, () =>
        this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await this.assertSlotFree(tx, booking.branchId, booking.staffMemberId, newStart, newEnd, booking.id);
          return tx.booking.update({
            where: { id: booking.id },
            data: { startTime: newStart, endTime: newEnd },
          });
        }),
      );
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('LOCK_BUSY')) {
        throw new ConflictException('این بازه در حال رزرو توسط کاربر دیگری است، لطفاً دوباره تلاش کنید');
      }
      throw err;
    }
  }

  // ---------------------------------------------------------
  // رزرو تکرارشونده — چند جلسه‌ی هفتگی در یک تراکنش all-or-nothing
  // ---------------------------------------------------------

  async createRecurring(userId: string, dto: CreateRecurringBookingDto) {
    const { business, service } = await this.loadAndValidateContext(
      dto.businessId,
      dto.branchId,
      dto.serviceId,
      dto.staffMemberId,
    );

    const firstStart = new Date(dto.startTime);
    const recurringGroupId = randomUUID();
    const occurrences: { startTime: Date; endTime: Date }[] = [];
    for (let i = 0; i < dto.occurrences; i++) {
      const start = new Date(firstStart.getTime() + i * 7 * 24 * 60 * 60000);
      const end = new Date(start.getTime() + service.durationMinutes * 60000);
      occurrences.push({ startTime: start, endTime: end });
    }

    try {
      return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const created = [];
        for (const occ of occurrences) {
          await this.assertSlotFree(tx, dto.branchId, dto.staffMemberId ?? null, occ.startTime, occ.endTime);
          const depositRequired = service.requiresDeposit
            ? this.round2((Number(service.price) * Number(service.depositPercent ?? 0)) / 100)
            : 0;
          const booking = await tx.booking.create({
            data: {
              userId,
              businessId: dto.businessId,
              branchId: dto.branchId,
              staffMemberId: dto.staffMemberId,
              serviceId: dto.serviceId,
              startTime: occ.startTime,
              endTime: occ.endTime,
              status: 'HOLD',
              priceSnapshot: service.price,
              depositRequired,
              cancellationPolicySnapshot: business.cancellationPolicy as Prisma.InputJsonValue,
              holdExpiresAt: new Date(Date.now() + HOLD_TTL_MINUTES * 60000),
              recurringGroupId,
            },
          });
          created.push(booking);
        }
        return created;
      });
    } catch (err) {
      if (err instanceof ConflictException) {
        throw new ConflictException(
          `امکان رزرو همه‌ی جلسات وجود نداشت (تداخل زمانی)؛ هیچ‌کدام ثبت نشد: ${err.message}`,
        );
      }
      throw err;
    }
  }

  // ---------------------------------------------------------
  // لیست‌ها
  // ---------------------------------------------------------

  async listMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      include: {
        service: { select: { name: true } },
        business: { select: { name: true } },
        branch: { select: { name: true, address: true } },
      },
    });
  }

  async listForBusiness(businessId: string, dto: ListBusinessBookingsDto) {
    return this.prisma.booking.findMany({
      where: {
        businessId,
        branchId: dto.branchId,
        staffMemberId: dto.staffMemberId,
        status: dto.status as never,
        startTime: {
          gte: dto.from ? new Date(dto.from) : undefined,
          lte: dto.to ? new Date(dto.to) : undefined,
        },
      },
      orderBy: { startTime: 'asc' },
      include: {
        service: { select: { name: true } },
        user: { select: { fullName: true, phone: true } },
      },
    });
  }

  async updateStatus(businessId: string, bookingId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findFirst({ where: { id: bookingId, businessId } });
    if (!booking) {
      throw new NotFoundException('رزرو یافت نشد');
    }
    if (!ALLOWED_STATUS_TRANSITIONS[booking.status]?.includes(dto.status)) {
      throw new BadRequestException(`انتقال وضعیت از ${booking.status} به ${dto.status} مجاز نیست`);
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: dto.status,
        ...(dto.status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
      },
    });
  }

  // ---------------------------------------------------------
  // نگهداری — آزادسازی HOLDهای منقضی (توسط cron صدا زده میشه)
  // ---------------------------------------------------------

  async releaseExpiredHolds(): Promise<number> {
    const result = await this.prisma.booking.updateMany({
      where: { status: 'HOLD', holdExpiresAt: { lt: new Date() } },
      data: { status: 'CANCELLED', cancelReason: 'انقضای خودکار مهلت تایید' },
    });
    return result.count;
  }

  // ---------------------------------------------------------
  // کمکی
  // ---------------------------------------------------------

  private async loadAndValidateContext(
    businessId: string,
    branchId: string,
    serviceId: string,
    staffMemberId?: string,
  ) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, status: 'APPROVED' },
    });
    if (!business) {
      throw new NotFoundException('کسب‌وکار یافت نشد یا هنوز تایید نشده است');
    }
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, businessId } });
    if (!branch) {
      throw new NotFoundException('شعبه یافت نشد');
    }
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, businessId, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('خدمت یافت نشد');
    }
    if (staffMemberId) {
      const staff = await this.prisma.staffMember.findFirst({
        where: { id: staffMemberId, businessId, isActive: true },
      });
      if (!staff) {
        throw new NotFoundException('کارمند یافت نشد');
      }
    }
    return { business, branch, service };
  }

  private async assertSlotFree(
    tx: Prisma.TransactionClient,
    branchId: string,
    staffMemberId: string | null | undefined,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ) {
    const overlapping = await tx.booking.findFirst({
      where: {
        branchId,
        staffMemberId: staffMemberId ?? null,
        status: { in: [...ACTIVE_STATUSES] },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (overlapping) {
      throw new ConflictException('این بازه‌ی زمانی دیگر آزاد نیست');
    }
  }

  private async getOwnedBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id: bookingId, userId } });
    if (!booking) {
      throw new NotFoundException('رزرو یافت نشد');
    }
    return booking;
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
