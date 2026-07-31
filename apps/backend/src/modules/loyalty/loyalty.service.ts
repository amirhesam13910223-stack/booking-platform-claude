import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

// آستانه‌های سطح — بر اساس مجموع امتیاز فعلی (نه تاریخی)، ساده و قابل تغییر.
const TIER_THRESHOLDS: { tier: string; minPoints: number }[] = [
  { tier: 'GOLD', minPoints: 5000 },
  { tier: 'SILVER', minPoints: 1000 },
  { tier: 'BRONZE', minPoints: 0 },
];

// هر ۱۰٬۰۰۰ تومان خرج‌شده = ۱ امتیاز — عدد ساده و قابل تنظیم آینده.
const TOMAN_PER_POINT = 10000;

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string) {
    const account = await this.prisma.loyaltyAccount.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    return account;
  }

  /**
   * بعد از یک خرید موفق صدا زده میشه (مثلاً وقتی رزرو COMPLETED میشه).
   * امتیاز رو اضافه می‌کنه و در صورت لزوم سطح رو ارتقا میده — همه در
   * یک تراکنش داده‌شده (برای هماهنگی با تراکنش صدازننده).
   */
  async earnFromPurchase(
    tx: Prisma.TransactionClient,
    userId: string,
    amountToman: number,
    reason: string,
    referenceId?: string,
  ): Promise<void> {
    const points = Math.floor(amountToman / TOMAN_PER_POINT);
    if (points <= 0) return;

    await this.addPoints(tx, userId, points, reason, referenceId);
  }

  async addPoints(
    tx: Prisma.TransactionClient,
    userId: string,
    points: number,
    reason: string,
    referenceId?: string,
  ): Promise<void> {
    const account = await tx.loyaltyAccount.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const newPoints = account.points + points;
    const newTier = TIER_THRESHOLDS.find((t) => newPoints >= t.minPoints)?.tier ?? 'BRONZE';

    await tx.loyaltyAccount.update({
      where: { userId },
      data: { points: newPoints, tier: newTier },
    });
    await tx.loyaltyTransaction.create({
      data: { accountId: account.id, points, reason, referenceId },
    });
  }
}
