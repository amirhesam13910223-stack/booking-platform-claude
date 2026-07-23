import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CancellationPolicyDto } from './dto/cancellation-policy.dto';
import { SearchBusinessDto } from './dto/search-business.dto';

const DEFAULT_CANCELLATION_POLICY = { freeCancelHours: 24, feePercent: 20 };

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------
  // ایجاد و مالکیت
  // ---------------------------------------------------------

  async create(ownerId: string, dto: CreateBusinessDto) {
    // ساخت کسب‌وکار و رکورد StaffMember (نقش OWNER) هم‌زمان در یک
    // تراکنش — تا هیچ‌وقت کسب‌وکاری بدون صاحب فعال نمونه.
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const business = await tx.business.create({
        data: {
          ownerId,
          name: dto.name,
          category: dto.category,
          description: dto.description,
          logoUrl: dto.logoUrl,
          cancellationPolicy: DEFAULT_CANCELLATION_POLICY,
        },
      });

      await tx.staffMember.create({
        data: {
          userId: ownerId,
          businessId: business.id,
          role: 'OWNER',
        },
      });

      return business;
    });
  }

  async findMine(userId: string) {
    const memberships = await this.prisma.staffMember.findMany({
      where: { userId, isActive: true },
      include: { business: true },
    });
    return memberships.map((m: (typeof memberships)[number]) => ({ ...m.business, myRole: m.role }));
  }

  async findOneForOwner(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { branches: true, services: true, documents: true },
    });
    if (!business) {
      throw new NotFoundException('کسب‌وکار یافت نشد');
    }
    return business;
  }

  // برای بازدیدکننده‌ی عمومی — فقط کسب‌وکار تایید‌شده قابل مشاهده‌ست
  async findOnePublic(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        branches: true,
        services: { where: { isActive: true } },
        reviews: { where: { status: 'APPROVED' }, take: 20, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!business || business.status !== 'APPROVED') {
      throw new NotFoundException('کسب‌وکار یافت نشد');
    }
    return business;
  }

  async update(businessId: string, dto: UpdateBusinessDto) {
    await this.assertExists(businessId);
    return this.prisma.business.update({ where: { id: businessId }, data: dto });
  }

  async updateCancellationPolicy(businessId: string, dto: CancellationPolicyDto) {
    await this.assertExists(businessId);
    return this.prisma.business.update({
      where: { id: businessId },
      data: { cancellationPolicy: { freeCancelHours: dto.freeCancelHours, feePercent: dto.feePercent } },
    });
  }

  // ---------------------------------------------------------
  // مدارک KYC
  // ---------------------------------------------------------

  async addDocument(businessId: string, type: 'NATIONAL_ID' | 'BUSINESS_LICENSE' | 'OTHER', fileUrl: string) {
    await this.assertExists(businessId);
    return this.prisma.businessDocument.create({
      data: { businessId, type, fileUrl },
    });
  }

  // ---------------------------------------------------------
  // جستجوی عمومی
  // ---------------------------------------------------------

  async search(dto: SearchBusinessDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;

    const where = {
      status: 'APPROVED' as const,
      ...(dto.query ? { name: { contains: dto.query, mode: 'insensitive' as const } } : {}),
      ...(dto.category ? { category: dto.category } : {}),
      ...(dto.city
        ? { branches: { some: { address: { contains: dto.city, mode: 'insensitive' as const } } } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.business.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { branches: { take: 1 } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.business.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // ---------------------------------------------------------
  // بررسی و تایید ادمین
  // ---------------------------------------------------------

  async listPendingForAdmin() {
    return this.prisma.business.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: { documents: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(businessId: string, adminId: string) {
    await this.assertExists(businessId);
    const business = await this.prisma.business.update({
      where: { id: businessId },
      data: { status: 'APPROVED', rejectReason: null },
    });
    await this.audit.log({
      actorId: adminId,
      action: 'BUSINESS_APPROVED',
      entityType: 'Business',
      entityId: businessId,
    });
    return business;
  }

  async reject(businessId: string, adminId: string, reason: string) {
    await this.assertExists(businessId);
    const business = await this.prisma.business.update({
      where: { id: businessId },
      data: { status: 'REJECTED', rejectReason: reason },
    });
    await this.audit.log({
      actorId: adminId,
      action: 'BUSINESS_REJECTED',
      entityType: 'Business',
      entityId: businessId,
      metadata: { reason },
    });
    return business;
  }

  async suspend(businessId: string, adminId: string, reason: string) {
    await this.assertExists(businessId);
    const business = await this.prisma.business.update({
      where: { id: businessId },
      data: { status: 'SUSPENDED', rejectReason: reason },
    });
    await this.audit.log({
      actorId: adminId,
      action: 'BUSINESS_SUSPENDED',
      entityType: 'Business',
      entityId: businessId,
      metadata: { reason },
    });
    return business;
  }

  // ---------------------------------------------------------
  // کمکی
  // ---------------------------------------------------------

  private async assertExists(businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('کسب‌وکار یافت نشد');
    }
    return business;
  }
}
