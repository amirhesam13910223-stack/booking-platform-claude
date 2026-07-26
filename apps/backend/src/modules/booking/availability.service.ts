import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';

export interface FreeSlot {
  startTime: string; // ISO
  endTime: string; // ISO
  // در حالتی که staff مشخص نشده، لیست کارمندهایی که در این بازه
  // آزادن رو برمی‌گردونیم — انتخاب نهایی موقع hold انجام میشه.
  availableStaffIds: (string | null)[];
}

const ACTIVE_BOOKING_STATUSES = ['HOLD', 'PENDING', 'CONFIRMED'] as const;

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getFreeSlots(businessId: string, dto: CheckAvailabilityDto): Promise<FreeSlot[]> {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, businessId, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('خدمت یافت نشد');
    }

    const branchId = dto.branchId;
    if (!branchId) {
      throw new NotFoundException('شعبه مشخص نشده است');
    }
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, businessId } });
    if (!branch) {
      throw new NotFoundException('شعبه یافت نشد');
    }

    const date = new Date(dto.date + 'T00:00:00.000Z');
    const dayOfWeek = date.getUTCDay();

    // تعیین کارمندهای کاندید: یا یک نفر مشخص، یا همه‌ی کسانی که به
    // این خدمت اختصاص داده شدن، یا در نبود هرکدوم، یک "بدون کارمند
    // مشخص" (walk-in) بر اساس ساعات کاری خود شعبه.
    let candidateStaffIds: (string | null)[];
    if (dto.staffMemberId) {
      const staff = await this.prisma.staffMember.findFirst({
        where: { id: dto.staffMemberId, businessId, isActive: true },
      });
      if (!staff) {
        throw new NotFoundException('کارمند یافت نشد');
      }
      candidateStaffIds = [dto.staffMemberId];
    } else {
      const assignments = await this.prisma.serviceStaff.findMany({
        where: { serviceId: dto.serviceId },
        select: { staffMemberId: true },
      });
      candidateStaffIds =
        assignments.length > 0
          ? assignments.map((a: { staffMemberId: string }) => a.staffMemberId)
          : [null];
    }

    const slotsByTime = new Map<string, FreeSlot>();

    for (const staffId of candidateStaffIds) {
      const window = await this.resolveWorkingWindow(branchId, staffId, dayOfWeek);
      if (!window) continue;

      const isHoliday = await this.isHoliday(branchId, staffId, date);
      if (isHoliday) continue;

      const bookings = await this.prisma.booking.findMany({
        where: {
          staffMemberId: staffId,
          branchId,
          status: { in: [...ACTIVE_BOOKING_STATUSES] },
          startTime: { gte: this.dayStart(date), lt: this.dayEnd(date) },
        },
        select: { startTime: true, endTime: true },
      });

      const slots = this.generateSlots(date, window, service.durationMinutes, bookings);
      for (const slot of slots) {
        const key = slot.toISOString();
        const existing = slotsByTime.get(key);
        if (existing) {
          existing.availableStaffIds.push(staffId);
        } else {
          const end = new Date(slot.getTime() + service.durationMinutes * 60000);
          slotsByTime.set(key, {
            startTime: slot.toISOString(),
            endTime: end.toISOString(),
            availableStaffIds: [staffId],
          });
        }
      }
    }

    return Array.from(slotsByTime.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  private async resolveWorkingWindow(
    branchId: string,
    staffId: string | null,
    dayOfWeek: number,
  ): Promise<{ startTime: string; endTime: string } | null> {
    if (staffId) {
      const staffHasAnyHours = await this.prisma.workingHours.findFirst({
        where: { staffMemberId: staffId },
      });
      if (staffHasAnyHours) {
        const dayHours = await this.prisma.workingHours.findFirst({
          where: { staffMemberId: staffId, dayOfWeek },
        });
        return dayHours ? { startTime: dayHours.startTime, endTime: dayHours.endTime } : null;
      }
      // کارمندی که هیچ ساعت کاری‌ای برای خودش تنظیم نکرده، ساعات شعبه رو ارث می‌بره.
    }

    const branchHours = await this.prisma.workingHours.findFirst({
      where: { branchId, dayOfWeek },
    });
    return branchHours ? { startTime: branchHours.startTime, endTime: branchHours.endTime } : null;
  }

  private async isHoliday(branchId: string, staffId: string | null, date: Date): Promise<boolean> {
    const dayStart = this.dayStart(date);
    const dayEnd = this.dayEnd(date);

    const staffHoliday = staffId
      ? await this.prisma.holiday.findFirst({
          where: { staffMemberId: staffId, date: { gte: dayStart, lt: dayEnd } },
        })
      : null;
    if (staffHoliday) return true;

    const branchHoliday = await this.prisma.holiday.findFirst({
      where: { branchId, date: { gte: dayStart, lt: dayEnd } },
    });
    return !!branchHoliday;
  }

  private generateSlots(
    date: Date,
    window: { startTime: string; endTime: string },
    durationMinutes: number,
    existingBookings: { startTime: Date; endTime: Date }[],
  ): Date[] {
    const result: Date[] = [];
    const [startH, startM] = window.startTime.split(':').map(Number);
    const [endH, endM] = window.endTime.split(':').map(Number);

    let cursor = new Date(date);
    cursor.setUTCHours(startH, startM, 0, 0);
    const windowEnd = new Date(date);
    windowEnd.setUTCHours(endH, endM, 0, 0);

    const now = new Date();

    while (cursor.getTime() + durationMinutes * 60000 <= windowEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + durationMinutes * 60000);

      const inPast = cursor <= now;
      const overlapsBooking = existingBookings.some(
        (b) => cursor < b.endTime && slotEnd > b.startTime,
      );

      if (!inPast && !overlapsBooking) {
        result.push(new Date(cursor));
      }
      cursor = new Date(cursor.getTime() + durationMinutes * 60000);
    }

    return result;
  }

  private dayStart(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private dayEnd(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d;
  }
}
