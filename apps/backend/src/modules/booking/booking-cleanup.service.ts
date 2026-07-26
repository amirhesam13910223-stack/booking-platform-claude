import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingService } from './booking.service';

@Injectable()
export class BookingCleanupService {
  private readonly logger = new Logger(BookingCleanupService.name);

  constructor(private readonly bookingService: BookingService) {}

  // هر دقیقه اجرا میشه — رزروهایی که در وضعیت HOLD موندن و مهلتشون
  // گذشته (کاربر تا انتهای مهلت پرداخت/تایید نکرده) رو آزاد می‌کنه
  // تا اون بازه‌ی زمانی دوباره در دسترس بقیه قرار بگیره.
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredHolds() {
    const count = await this.bookingService.releaseExpiredHolds();
    if (count > 0) {
      this.logger.log(`${count} رزرو HOLD منقضی‌شده آزاد شد`);
    }
  }
}
