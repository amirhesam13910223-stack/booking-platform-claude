import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './sms.interface';

// پیاده‌سازی موقت: در حالت dev فقط لاگ می‌کنه تا بشه OTP رو دید و تست کرد.
// این‌جا عمداً درگاه واقعی پیامک وصل نیست — اتصال به provider واقعی
// (مثلاً کاوه‌نگار) کار یک فاز جداست تا هم credential واقعی لازم نداشته
// باشیم و هم پیام‌های تست باعث هزینه‌ی واقعی نشن.
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  async send(phone: string, message: string): Promise<void> {
    this.logger.log(`[SMS → ${phone}] ${message}`);
  }
}
