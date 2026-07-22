import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SMS_PROVIDER, SmsProvider } from '../../common/sms/sms.interface';
import { sha256Hash } from '../../common/crypto/hash.util';
import { TooManyRequestsException } from '../../common/exceptions/too-many-requests.exception';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;
// حداقل فاصله بین دو درخواست OTP برای همون شماره — جلوگیری از
// سیل درخواست پیامک (هزینه‌ی مالی) حتی اگر IP عوض بشه.
const RESEND_COOLDOWN_SECONDS = 60;

export type OtpPurpose = 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    private readonly config: ConfigService,
  ) {}

  /**
   * تا وقتی provider پیامک واقعی وصل نشده، به‌جای اعتماد به پیامک،
   * می‌تونیم کد رو مستقیم در پاسخ API برگردونیم تا فرانت همون‌جا
   * نشونش بده. این قابلیت با دو لایه محافظت می‌شه:
   *  ۱. فقط وقتی OTP_DEBUG_EXPOSE=true باشه فعاله (پیش‌فرض خاموش).
   *  ۲. صرف‌نظر از مقدار env، در NODE_ENV=production همیشه غیرفعاله —
   *     یعنی یک تنظیم env فراموش‌شده نمی‌تونه در محیط واقعی کد رو لو بده.
   * وقتی provider واقعی (کاوه‌نگار و...) وصل شد، این env رو false
   * کنید یا کلاً از .env حذفش کنید.
   */
  private get debugExposeEnabled(): boolean {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    const flagEnabled = this.config.get<string>('OTP_DEBUG_EXPOSE') === 'true';
    return !isProduction && flagEnabled;
  }

  async requestOtp(
    phone: string,
    purpose: OtpPurpose,
    userId?: string,
  ): Promise<{ debugCode?: string }> {
    const recent = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (recent) {
      const secondsSinceLast = (Date.now() - recent.createdAt.getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        throw new TooManyRequestsException(
          `لطفاً ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)} ثانیه دیگر دوباره تلاش کنید`,
        );
      }
    }

    const code = randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
    const codeHash = sha256Hash(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { phone, userId, purpose, codeHash, expiresAt },
    });

    await this.sms.send(phone, `کد تایید شما: ${code} (اعتبار ${OTP_TTL_MINUTES} دقیقه)`);

    return this.debugExposeEnabled ? { debugCode: code } : {};
  }

  /**
   * کد رو معتبرسنجی می‌کنه؛ در صورت موفقیت رکورد رو consumed علامت
   * می‌زنه (یک‌بارمصرف بودن) و true برمی‌گردونه. در غیر این صورت
   * شمارنده‌ی تلاش رو افزایش می‌ده تا جلوی brute-force گرفته بشه.
   */
  async verifyOtp(phone: string, purpose: OtpPurpose, code: string): Promise<boolean> {
    const record = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('کد معتبری برای این شماره یافت نشد، دوباره درخواست دهید');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('کد منقضی شده است، دوباره درخواست دهید');
    }
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new TooManyRequestsException('تعداد تلاش‌های مجاز تمام شد، دوباره درخواست دهید');
    }

    const isValid = record.codeHash === sha256Hash(code);

    if (!isValid) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }

    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    return true;
  }
}
