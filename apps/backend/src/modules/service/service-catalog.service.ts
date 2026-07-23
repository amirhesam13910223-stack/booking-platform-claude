import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  create(businessId: string, dto: CreateServiceDto) {
    if (dto.requiresDeposit && !dto.depositPercent) {
      throw new BadRequestException('برای فعال کردن بیعانه باید درصد آن مشخص شود');
    }
    return this.prisma.service.create({ data: { businessId, ...dto } });
  }

  findAll(businessId: string) {
    return this.prisma.service.findMany({ where: { businessId } });
  }

  async update(businessId: string, serviceId: string, dto: UpdateServiceDto) {
    await this.assertBelongsToBusiness(businessId, serviceId);
    return this.prisma.service.update({ where: { id: serviceId }, data: dto });
  }

  // اختصاص/لغو اختصاص یک کارمند به یک خدمت — تعیین می‌کنه کدوم
  // کارمند می‌تونه این خدمت رو انجام بده (برای موتور رزرو در فاز ۳ لازمه).
  async assignStaff(businessId: string, serviceId: string, staffMemberId: string) {
    await this.assertBelongsToBusiness(businessId, serviceId);
    const staff = await this.prisma.staffMember.findUnique({ where: { id: staffMemberId } });
    if (!staff || staff.businessId !== businessId) {
      throw new NotFoundException('کارمند یافت نشد');
    }
    return this.prisma.serviceStaff.upsert({
      where: { serviceId_staffMemberId: { serviceId, staffMemberId } },
      create: { serviceId, staffMemberId },
      update: {},
    });
  }

  async unassignStaff(businessId: string, serviceId: string, staffMemberId: string) {
    await this.assertBelongsToBusiness(businessId, serviceId);
    await this.prisma.serviceStaff.delete({
      where: { serviceId_staffMemberId: { serviceId, staffMemberId } },
    });
    return { message: 'کارمند از این خدمت حذف شد' };
  }

  private async assertBelongsToBusiness(businessId: string, serviceId: string) {
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.businessId !== businessId) {
      throw new NotFoundException('خدمت یافت نشد');
    }
    return service;
  }
}
