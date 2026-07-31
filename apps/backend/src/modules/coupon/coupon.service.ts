import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

export interface CouponCheckResult {
  couponId: string;
  discountAmount: number;
}

@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // مدیریت کوپن (کسب‌وکار یا ادمین برای کوپن سراسری)
  // ---------------------------------------------------------

  async createForBusiness(businessId: string, dto: CreateCouponDto) {
    return this.create({ ...dto, businessId });
  }

  async createGlobal(dto: CreateCouponDto) {
    return this.create({ ...dto, businessId: null });
  }

  private async create(dto: CreateCouponDto & { businessId: string | null }) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException('این کد کوپن قبلاً استفاده شده است');
    }
    if (new Date(dto.validFrom) >= new Date(dto.validTo)) {
      throw new BadRequestException('تاریخ شروع باید قبل از تاریخ پایان باشد');
    }

    return this.prisma.coupon.create({
      data: {
        businessId: dto.businessId,
        code: dto.code,
        type: dto.type,
        value: dto.value,
        minPurchase: dto.minPurchase,
        usageLimit: dto.usageLimit,
        validFrom: new Date(dto.validFrom),
        validTo: new Date(dto.validTo),
      },
    });
  }

  async listForBusiness(businessId: string) {
    return this.prisma.coupon.findMany({ where: { businessId }, orderBy: { validFrom: 'desc' } });
  }

  async listGlobal() {
    return this.prisma.coupon.findMany({ where: { businessId: null }, orderBy: { validFrom: 'desc' } });
  }

  async update(couponId: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      throw new NotFoundException('کوپن یافت نشد');
    }
    return this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        type: dto.type,
        value: dto.value,
        minPurchase: dto.minPurchase,
        usageLimit: dto.usageLimit,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  // ---------------------------------------------------------
  // اعتبارسنجی (dry-run — چیزی رو mutate نمی‌کنه)
  // ---------------------------------------------------------

  async validate(
    code: string,
    userId: string,
    businessId: string | undefined,
    purchaseAmount: number,
  ): Promise<CouponCheckResult> {
    return this.checkAndCompute(this.prisma, code, userId, businessId, purchaseAmount);
  }

  // ---------------------------------------------------------
  // مصرف واقعی — فقط از داخل یک تراکنش دیگه (مثلاً hold رزرو) صدا
  // زده میشه تا اتمیک باشه؛ همون tx client رو می‌گیره.
  // ---------------------------------------------------------

  async checkAndRedeem(
    tx: Prisma.TransactionClient,
    code: string,
    userId: string,
    businessId: string | undefined,
    purchaseAmount: number,
    bookingId?: string,
  ): Promise<CouponCheckResult> {
    const result = await this.checkAndCompute(tx, code, userId, businessId, purchaseAmount);

    await tx.couponUsage.create({
      data: {
        couponId: result.couponId,
        userId,
        bookingId,
        discountAmount: result.discountAmount,
      },
    });
    await tx.coupon.update({
      where: { id: result.couponId },
      data: { usageCount: { increment: 1 } },
    });

    return result;
  }

  private async checkAndCompute(
    client: Prisma.TransactionClient | PrismaService,
    code: string,
    userId: string,
    businessId: string | undefined,
    purchaseAmount: number,
  ): Promise<CouponCheckResult> {
    const coupon = await client.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('کد تخفیف نامعتبر است');
    }
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      throw new BadRequestException('این کد تخفیف منقضی شده یا هنوز فعال نشده است');
    }
    if (coupon.businessId && coupon.businessId !== businessId) {
      throw new BadRequestException('این کد تخفیف برای این کسب‌وکار معتبر نیست');
    }
    if (coupon.minPurchase && purchaseAmount < Number(coupon.minPurchase)) {
      throw new BadRequestException(
        `حداقل مبلغ خرید برای این کد ${Number(coupon.minPurchase).toLocaleString('fa-IR')} تومان است`,
      );
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('ظرفیت استفاده از این کد تمام شده است');
    }

    const alreadyUsed = await client.couponUsage.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId } },
    });
    if (alreadyUsed) {
      throw new BadRequestException('شما قبلاً از این کد استفاده کرده‌اید');
    }

    const rawDiscount =
      coupon.type === 'PERCENTAGE'
        ? (purchaseAmount * Number(coupon.value)) / 100
        : Number(coupon.value);
    const discountAmount = Math.min(Math.round(rawDiscount), purchaseAmount);

    return { couponId: coupon.id, discountAmount };
  }
}
