import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto';
import { AddHolidayDto } from './dto/add-holiday.dto';

@Injectable()
export class WorkingHoursService {
  constructor(private readonly prisma: PrismaService) {}

  async setWorkingHours(businessId: string, dto: SetWorkingHoursDto) {
    const { branchId, staffMemberId } = await this.resolveTarget(businessId, dto.branchId, dto.staffMemberId);

    for (const entry of dto.hours) {
      if (entry.startTime >= entry.endTime) {
        throw new BadRequestException('ساعت پایان باید بعد از ساعت شروع باشد');
      }
    }

    // PUT معنی جایگزینی کامله: ساعات قبلی حذف و لیست جدید جایگزین میشه.
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.workingHours.deleteMany({
        where: branchId ? { branchId } : { staffMemberId },
      });
      await tx.workingHours.createMany({
        data: dto.hours.map((h) => ({
          branchId,
          staffMemberId,
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
        })),
      });
      return tx.workingHours.findMany({ where: branchId ? { branchId } : { staffMemberId } });
    });
  }

  async addHoliday(businessId: string, dto: AddHolidayDto) {
    const { branchId, staffMemberId } = await this.resolveTarget(businessId, dto.branchId, dto.staffMemberId);
    return this.prisma.holiday.create({
      data: { branchId, staffMemberId, date: new Date(dto.date), reason: dto.reason },
    });
  }

  async listHolidays(businessId: string, branchId?: string, staffMemberId?: string) {
    const target = await this.resolveTarget(businessId, branchId, staffMemberId);
    return this.prisma.holiday.findMany({
      where: target.branchId ? { branchId: target.branchId } : { staffMemberId: target.staffMemberId },
      orderBy: { date: 'asc' },
    });
  }

  private async resolveTarget(businessId: string, branchId?: string, staffMemberId?: string) {
    if ((branchId && staffMemberId) || (!branchId && !staffMemberId)) {
      throw new BadRequestException('دقیقاً یکی از branchId یا staffMemberId باید مشخص شود');
    }

    if (branchId) {
      const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch || branch.businessId !== businessId) {
        throw new NotFoundException('شعبه یافت نشد');
      }
      return { branchId, staffMemberId: undefined };
    }

    const staff = await this.prisma.staffMember.findUnique({ where: { id: staffMemberId } });
    if (!staff || staff.businessId !== businessId) {
      throw new NotFoundException('کارمند یافت نشد');
    }
    return { branchId: undefined, staffMemberId };
  }
}
