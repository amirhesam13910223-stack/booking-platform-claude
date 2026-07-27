import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RunSettlementDto } from './dto/run-settlement.dto';

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

  async runForBusiness(businessId: string, periodStart: Date, periodEnd: Date) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('کسب‌وکار یافت نشد');
    }

    // مجموع تراکنش‌های موفق مرتبط با رزروهای این کسب‌وکار در بازه‌ی زمانی
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        type: { in: ['DEPOSIT', 'FULL_PAYMENT'] },
        createdAt: { gte: periodStart, lte: periodEnd },
        booking: { businessId },
      },
    });

    // نکته: پارامتر عمداً `any` صریحه (نه امضای دقیق‌تر) چون تایپ
    // واقعی این فیلد در Prisma (`Decimal`) در سندباکس توسعه که client
    // کامل generate نمی‌شه در دسترس نیست؛ `any` صریح هم خطای
    // noImplicitAny محلی رو رفع می‌کنه هم با تایپ واقعی روی CI (که
    // Decimal واقعیه) بدون تناقض کار می‌کنه.
    const amounts = payments.map((p: any) => Number(p.amount)); // eslint-disable-line @typescript-eslint/no-explicit-any
    const grossAmount = amounts.reduce((sum: number, n: number) => sum + n, 0);
    const commissionPercent = Number(business.commissionPercent);
    const commissionAmount = Math.round((grossAmount * commissionPercent) / 100);
    const netAmount = grossAmount - commissionAmount;

    return this.prisma.settlement.create({
      data: { businessId, periodStart, periodEnd, grossAmount, commissionAmount, netAmount },
    });
  }

  async runBatch(dto: RunSettlementDto) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    if (dto.businessId) {
      return [await this.runForBusiness(dto.businessId, periodStart, periodEnd)];
    }

    const businesses = await this.prisma.business.findMany({
      where: { status: 'APPROVED' },
      select: { id: true },
    });
    const results = [];
    for (const b of businesses) {
      results.push(await this.runForBusiness(b.id, periodStart, periodEnd));
    }
    return results;
  }

  async listForBusiness(businessId: string) {
    return this.prisma.settlement.findMany({
      where: { businessId },
      orderBy: { periodStart: 'desc' },
    });
  }
}
