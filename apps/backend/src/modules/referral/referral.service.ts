import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

const REFERRAL_REWARD_POINTS = 100; // هم به معرف هم به معرفی‌شده

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loyalty: LoyaltyService,
  ) {}

  // کد ارجاع = شناسه‌ی کاربر؛ نیازی به فیلد جدا در schema نیست و
  // همیشه یکتا و قابل‌اعتماده.
  async getMyCode(userId: string) {
    return { code: userId };
  }

  /**
   * موقع ثبت‌نام صدا زده میشه (اگه کاربر جدید یک کد ارجاع وارد کرده باشه).
   * خطاهای این متد نباید جلوی ثبت‌نام رو بگیرن — فقط لاگ میشن؛ ارجاع
   * یک ویژگی جانبیه، نه بخشی از مسیر حیاتی ثبت‌نام.
   */
  async registerReferral(referrerCode: string, refereeId: string): Promise<void> {
    try {
      if (referrerCode === refereeId) {
        return; // کسی نمی‌تونه خودش رو معرفی کنه
      }
      const referrer = await this.prisma.user.findUnique({ where: { id: referrerCode } });
      if (!referrer) {
        return; // کد ارجاع نامعتبر — بی‌سروصدا نادیده گرفته میشه
      }
      const existing = await this.prisma.referral.findUnique({ where: { refereeId } });
      if (existing) {
        return;
      }
      await this.prisma.referral.create({
        data: { referrerId: referrerCode, refereeId },
      });
    } catch (err) {
      this.logger.warn(`ثبت ارجاع ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * بعد از اولین خرید موفق کاربرِ معرفی‌شده صدا زده میشه. اگه یک
   * ارجاع PENDING براش وجود داشته باشه، هم به معرف هم به معرفی‌شده
   * امتیاز وفاداری میده و وضعیت رو REWARDED می‌کنه.
   */
  async rewardIfEligible(tx: Prisma.TransactionClient, refereeId: string): Promise<void> {
    const referral = await tx.referral.findUnique({ where: { refereeId } });
    if (!referral || referral.status !== 'PENDING') {
      return;
    }

    await this.loyalty.addPoints(
      tx,
      referral.referrerId,
      REFERRAL_REWARD_POINTS,
      'پاداش معرفی موفق دوست',
      referral.id,
    );
    await this.loyalty.addPoints(
      tx,
      referral.refereeId,
      REFERRAL_REWARD_POINTS,
      'پاداش خوش‌آمدگویی (معرفی‌شده)',
      referral.id,
    );

    await tx.referral.update({
      where: { id: referral.id },
      data: { status: 'REWARDED', rewardedAt: new Date() },
    });
  }
}
