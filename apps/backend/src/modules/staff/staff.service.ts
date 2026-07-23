import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InviteStaffDto } from './dto/invite-staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * محدودیت فعلی (آگاهانه، برای فاز بعدی): این متد فقط برای کاربرانی
   * کار می‌کنه که از قبل در پلتفرم ثبت‌نام کرده باشن. یک جریان کامل
   * دعوت (پیامک لینک به شماره‌ی ثبت‌نام‌نکرده + وضعیت PENDING) نیاز
   * به افزودن یک مدل Invite جدا به schema داره که در این فاز اضافه
   * نشده تا scope فاز ۲ کنترل‌شده بمونه.
   */
  async invite(businessId: string, dto: InviteStaffDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      throw new BadRequestException(
        'این شماره هنوز در پلتفرم ثبت‌نام نکرده؛ ابتدا باید ثبت‌نام کند',
      );
    }

    const existing = await this.prisma.staffMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
    });
    if (existing) {
      throw new ConflictException('این کاربر از قبل عضو این کسب‌وکار است');
    }

    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
      if (!branch || branch.businessId !== businessId) {
        throw new NotFoundException('شعبه یافت نشد');
      }
    }

    return this.prisma.staffMember.create({
      data: {
        userId: user.id,
        businessId,
        role: dto.role,
        specialty: dto.specialty,
        branchId: dto.branchId,
      },
    });
  }

  findAll(businessId: string) {
    return this.prisma.staffMember.findMany({
      where: { businessId },
      include: { user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } } },
    });
  }

  async deactivate(businessId: string, staffMemberId: string) {
    const staff = await this.prisma.staffMember.findUnique({ where: { id: staffMemberId } });
    if (!staff || staff.businessId !== businessId) {
      throw new NotFoundException('کارمند یافت نشد');
    }
    if (staff.role === 'OWNER') {
      throw new BadRequestException('نمی‌توان مالک کسب‌وکار را غیرفعال کرد');
    }
    return this.prisma.staffMember.update({
      where: { id: staffMemberId },
      data: { isActive: false },
    });
  }
}
